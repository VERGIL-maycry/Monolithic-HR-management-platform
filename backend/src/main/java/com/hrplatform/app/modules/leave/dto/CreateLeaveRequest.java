package com.hrplatform.app.modules.leave.dto;

import com.hrplatform.app.modules.leave.entity.LeaveType;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record CreateLeaveRequest(
        // Date de début (doit être aujourd'hui ou dans le futur)
        @NotNull(message = "Start date is required")
        @FutureOrPresent(message = "Start date cannot be in the past")
        LocalDate startDate,

        // Date de fin
        @NotNull(message = "End date is required")
        LocalDate endDate,

        // Type de congé (PAID_LEAVE, UNPAID_LEAVE, SICK_LEAVE)
        @NotNull(message = "Leave type is required")
        LeaveType type,

        // Motif optionnel
        String reason
) {
}