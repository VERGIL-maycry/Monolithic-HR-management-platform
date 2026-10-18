package com.hrplatform.app.modules.leave.service;

import com.hrplatform.app.modules.auth.entity.Role;
import com.hrplatform.app.modules.auth.entity.User;
import com.hrplatform.app.modules.auth.repository.UserRepository;
import com.hrplatform.app.modules.employee.entity.Employee;
import com.hrplatform.app.modules.employee.repository.EmployeeRepository;
import com.hrplatform.app.modules.leave.dto.*;
import com.hrplatform.app.modules.leave.entity.*;
import com.hrplatform.app.modules.leave.event.*;
import com.hrplatform.app.modules.leave.repository.LeaveBalanceRepository;
import com.hrplatform.app.modules.leave.repository.LeaveRequestRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
public class LeaveService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final LeaveBalanceRepository leaveBalanceRepository;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;

    public LeaveService(LeaveRequestRepository leaveRequestRepository,
                        LeaveBalanceRepository leaveBalanceRepository,
                        EmployeeRepository employeeRepository,
                        UserRepository userRepository,
                        ApplicationEventPublisher eventPublisher) {
        this.leaveRequestRepository = leaveRequestRepository;
        this.leaveBalanceRepository = leaveBalanceRepository;
        this.employeeRepository = employeeRepository;
        this.userRepository = userRepository;
        this.eventPublisher = eventPublisher;
    }

    // =========================================================================
    // 1. DÉPOSER UNE DEMANDE DE CONGÉ (PAR L'EMPLOYÉ CONNECTÉ)
    // =========================================================================
    @Transactional
    public LeaveResponse createLeaveRequest(String userEmail, CreateLeaveRequest request) {
        // 1. Trouver l'employé connecté
        Employee employee = getEmployeeByEmail(userEmail);

        // 2. Vérifier la cohérence des dates
        if (request.endDate().isBefore(request.startDate())) {
            throw new IllegalArgumentException("End date cannot be before start date");
        }

        // 3. Calculer la durée en jours (ex: du 10 au 12 = 3 jours inclus)
        int days = (int) ChronoUnit.DAYS.between(request.startDate(), request.endDate()) + 1;

        // 4. Si c'est un congé payé (PAID_LEAVE), vérifier que le solde restant est suffisant
        int year = request.startDate().getYear();
        LeaveBalance balance = getOrCreateBalance(employee, year);

        if (request.type() == LeaveType.PAID_LEAVE) {
            if (balance.getRemainingDays() < days) {
                throw new IllegalArgumentException(
                        "Solde de congés insuffisant. Jours restants : " + balance.getRemainingDays()
                                + ", Jours demandés : " + days
                );
            }
        }

        // 5. Créer et enregistrer la demande en statut PENDING
        LeaveRequest leaveRequest = new LeaveRequest(
                employee,
                request.startDate(),
                request.endDate(),
                days,
                request.type(),
                request.reason()
        );

        LeaveRequest saved = leaveRequestRepository.save(leaveRequest);
        // Si l'employé a un manager, on publie l'événement pour notifier ce dernier
        if (employee.getManager() != null) {
            eventPublisher.publishEvent(new LeaveRequestedEvent(
                    employee.getFirstName() + " " + employee.getLastName(),
                    employee.getManager().getUser().getId(),
                    days,
                    request.startDate(),
                    request.endDate(),
                    saved.getId(),
                    userEmail
            ));
        }
        return toLeaveResponse(saved);
    }

    // =========================================================================
    // 2. CONSULTER SES PROPRES DEMANDES (EMPLOYÉ CONNECTÉ)
    // =========================================================================
    public List<LeaveResponse> getMyLeaves(String userEmail) {
        Employee employee = getEmployeeByEmail(userEmail);
        return leaveRequestRepository.findByEmployeeIdOrderByCreatedAtDesc(employee.getId())
                .stream()
                .map(this::toLeaveResponse)
                .toList();
    }

    // =========================================================================
    // 3. CONSULTER SON SOLDE DE CONGÉS (EMPLOYÉ CONNECTÉ)
    // =========================================================================
    public LeaveBalanceResponse getMyBalance(String userEmail, Integer year) {
        Employee employee = getEmployeeByEmail(userEmail);
        int targetYear = (year != null) ? year : LocalDate.now().getYear();
        LeaveBalance balance = getOrCreateBalance(employee, targetYear);
        return toBalanceResponse(balance);
    }

    // =========================================================================
    // 4. LE MANAGER CONSULTE LES DEMANDES DE SON ÉQUIPE
    // =========================================================================
    public List<LeaveResponse> getTeamLeaves(String managerUserEmail, LeaveStatus status) {
        List<LeaveRequest> leaves;
        if (isHrOrAdmin(managerUserEmail)) {
            leaves = status != null
                    ? leaveRequestRepository.findByStatusOrderByCreatedAtDesc(status)
                    : leaveRequestRepository.findAllByOrderByCreatedAtDesc();
        } else {
            Employee manager = getEmployeeByEmail(managerUserEmail);
            if (status != null) {
                leaves = leaveRequestRepository.findByEmployeeManagerIdAndStatusOrderByCreatedAtDesc(manager.getId(), status);
            } else {
                leaves = leaveRequestRepository.findByEmployeeManagerIdOrderByCreatedAtDesc(manager.getId());
            }
        }

        return leaves.stream()
                .map(this::toLeaveResponse)
                .toList();
    }

    // =========================================================================
    // 5. LE MANAGER ACCEPTE LA DEMANDE (DÉDUCTION AUTOMATIQUE DU SOLDE)
    // =========================================================================
    @Transactional
    public LeaveResponse approveLeave(UUID leaveRequestId, String managerUserEmail, ReviewLeaveRequest review) {
        LeaveRequest leave = leaveRequestRepository.findById(leaveRequestId)
                .orElseThrow(() -> new IllegalArgumentException("Leave request not found: " + leaveRequestId));

        // Règle : Une demande ne peut être approuvée que si elle est PENDING
        if (leave.getStatus() != LeaveStatus.PENDING) {
            throw new IllegalStateException("Only PENDING requests can be approved. Current status: " + leave.getStatus());
        }

        assertCanReview(leave, managerUserEmail);

        // Si congé payé : Déduire automatiquement les jours du solde
        if (leave.getType() == LeaveType.PAID_LEAVE) {
            int year = leave.getStartDate().getYear();
            LeaveBalance balance = getOrCreateBalance(leave.getEmployee(), year);

            if (balance.getRemainingDays() < leave.getDays()) {
                throw new IllegalStateException("Insufficient remaining days to approve this leave");
            }

            // Déduction
            balance.setUsedDays(balance.getUsedDays() + leave.getDays());
            balance.setRemainingDays(balance.getRemainingDays() - leave.getDays());
            leaveBalanceRepository.save(balance);
        }

        // Mettre à jour le statut du congé
        leave.setStatus(LeaveStatus.APPROVED);
        if (review != null && review.comment() != null) {
            leave.setManagerComment(review.comment());
        }

        LeaveRequest updated = leaveRequestRepository.save(leave);
        // Publication de l'événement d'acceptation de congé
        eventPublisher.publishEvent(new LeaveApprovedEvent(
                leave.getEmployee().getUser().getId(),
                leave.getEmployee().getFirstName() + " " + leave.getEmployee().getLastName(),
                leave.getDays(),
                (review != null) ? review.comment() : null,
                updated.getId(),
                managerUserEmail
        ));
        return toLeaveResponse(updated);
    }

    // =========================================================================
    // 6. LE MANAGER REFUSE LA DEMANDE
    // =========================================================================
    @Transactional
    public LeaveResponse rejectLeave(UUID leaveRequestId, String managerUserEmail, ReviewLeaveRequest review) {
        LeaveRequest leave = leaveRequestRepository.findById(leaveRequestId)
                .orElseThrow(() -> new IllegalArgumentException("Leave request not found: " + leaveRequestId));

        if (leave.getStatus() != LeaveStatus.PENDING) {
            throw new IllegalStateException("Only PENDING requests can be rejected. Current status: " + leave.getStatus());
        }

        assertCanReview(leave, managerUserEmail);

        leave.setStatus(LeaveStatus.REJECTED);
        if (review != null && review.comment() != null) {
            leave.setManagerComment(review.comment());
        }

        LeaveRequest updated = leaveRequestRepository.save(leave);
        // Publication de l'événement de refus de congé
        eventPublisher.publishEvent(new LeaveRejectedEvent(
                leave.getEmployee().getUser().getId(),
                leave.getEmployee().getFirstName() + " " + leave.getEmployee().getLastName(),
                leave.getDays(),
                (review != null) ? review.comment() : null,
                updated.getId(),
                managerUserEmail
        ));
        return toLeaveResponse(updated);
    }

    // =========================================================================
    // 7. L'EMPLOYÉ ANNULE SA DEMANDE (SI ENCORE PENDING)
    // =========================================================================
    @Transactional
    public LeaveResponse cancelLeave(UUID leaveRequestId, String userEmail) {
        LeaveRequest leave = leaveRequestRepository.findById(leaveRequestId)
                .orElseThrow(() -> new IllegalArgumentException("Leave request not found: " + leaveRequestId));

        Employee employee = getEmployeeByEmail(userEmail);

        // Seul l'employé propriétaire peut annuler sa propre demande
        if (!leave.getEmployee().getId().equals(employee.getId())) {
            throw new IllegalArgumentException("You can only cancel your own leave requests");
        }

        // Règle : Une fois acceptée, elle ne peut plus être annulée/modifiée
        if (leave.getStatus() != LeaveStatus.PENDING) {
            throw new IllegalStateException("Only PENDING requests can be cancelled. Accepted requests cannot be modified.");
        }

        leave.setStatus(LeaveStatus.CANCELED);
        LeaveRequest updated = leaveRequestRepository.save(leave);
        return toLeaveResponse(updated);
    }

    // =========================================================================
    // MÉTHODES UTILITAIRES PRIVÉES
    // =========================================================================

    // Initialise automatiquement un solde de 22 jours pour l'employé s'il n'existe pas encore pour l'année
    private LeaveBalance getOrCreateBalance(Employee employee, int year) {
        return leaveBalanceRepository.findByEmployeeIdAndYear(employee.getId(), year)
                .orElseGet(() -> {
                    LeaveBalance newBalance = new LeaveBalance(employee, year, 22);
                    return leaveBalanceRepository.save(newBalance);
                });
    }

    private Employee getEmployeeByEmail(String userEmail) {
        return employeeRepository.findByUserEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("No employee profile found for email: " + userEmail));
    }

    private LeaveResponse toLeaveResponse(LeaveRequest leave) {
        String employeeFullName = leave.getEmployee().getFirstName() + " " + leave.getEmployee().getLastName();
        return new LeaveResponse(
                leave.getId(),
                leave.getEmployee().getId(),
                employeeFullName,
                leave.getEmployee().getEmployeeCode(),
                leave.getStartDate(),
                leave.getEndDate(),
                leave.getDays(),
                leave.getType(),
                leave.getReason(),
                leave.getStatus(),
                leave.getCreatedAt(),
                leave.getManagerComment()
        );
    }

    private LeaveBalanceResponse toBalanceResponse(LeaveBalance balance) {
        String employeeFullName = balance.getEmployee().getFirstName() + " " + balance.getEmployee().getLastName();
        return new LeaveBalanceResponse(
                balance.getId(),
                balance.getEmployee().getId(),
                employeeFullName,
                balance.getYear(),
                balance.getTotalDays(),
                balance.getUsedDays(),
                balance.getRemainingDays()
        );
    }

    /** Returns true if the user has the ADMIN or HR role (bypasses manager check). */
    private boolean isHrOrAdmin(String email) {
        return userRepository.findByEmail(email)
                .map(u -> u.getRole() == Role.ADMIN || u.getRole() == Role.HR)
                .orElse(false);
    }

    /** Ensures the caller is either the employee's direct manager, or an HR/Admin user. */
    private void assertCanReview(LeaveRequest leave, String reviewerEmail) {
        if (isHrOrAdmin(reviewerEmail)) return; // HR and Admin can review anyone's leave

        Employee reviewer = getEmployeeByEmail(reviewerEmail);
        if (leave.getEmployee().getManager() == null ||
                !leave.getEmployee().getManager().getId().equals(reviewer.getId())) {
            throw new IllegalArgumentException("You are not authorized to review this leave request");
        }
    }
}