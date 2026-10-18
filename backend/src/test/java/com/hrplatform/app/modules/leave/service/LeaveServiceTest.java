package com.hrplatform.app.modules.leave.service;

import com.hrplatform.app.modules.employee.entity.Employee;
import com.hrplatform.app.modules.leave.dto.CreateLeaveRequest;
import com.hrplatform.app.modules.leave.entity.LeaveBalance;
import com.hrplatform.app.modules.leave.entity.LeaveType;
import com.hrplatform.app.modules.leave.repository.LeaveBalanceRepository;
import com.hrplatform.app.modules.leave.repository.LeaveRequestRepository;
import com.hrplatform.app.modules.employee.repository.EmployeeRepository;
import com.hrplatform.app.modules.auth.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class LeaveServiceTest {

    @Mock
    private LeaveRequestRepository leaveRequestRepository;

    @Mock
    private LeaveBalanceRepository balanceRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private LeaveService leaveService;

    @Test
    public void testCreateLeaveRequest_InsufficientBalance_ThrowsException() {
        // Arrange
        Employee employee = new Employee();
        LeaveBalance balance = new LeaveBalance(employee, 2026, 5); // Solde de 5 jours
        
        when(employeeRepository.findByUserEmail(any())).thenReturn(Optional.of(employee));
        when(balanceRepository.findByEmployeeIdAndYear(any(), anyInt()))
                .thenReturn(Optional.of(balance));

        CreateLeaveRequest request = new CreateLeaveRequest(
                LocalDate.of(2026, 9, 1),
                LocalDate.of(2026, 9, 10), // Demande de 10 jours
                LeaveType.PAID_LEAVE,
                "Vacances"
        );

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> {
            leaveService.createLeaveRequest("employee@hr.com", request);
        });
    }
}
