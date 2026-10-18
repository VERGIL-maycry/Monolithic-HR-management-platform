package com.hrplatform.app.modules.leave.dto;

import java.util.UUID;

public record LeaveBalanceResponse(
        UUID id,
        UUID employeeId,
        String employeeFullName,
        int year,
        int totalDays,
        int usedDays,
        int remainingDays
) {
}