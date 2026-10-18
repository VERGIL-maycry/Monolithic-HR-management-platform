package com.hrplatform.app.modules.leave.dto;

import com.hrplatform.app.modules.leave.entity.LeaveStatus;
import com.hrplatform.app.modules.leave.entity.LeaveType;
import java.time.LocalDate;
import java.util.UUID;

public record LeaveResponse(
        UUID id,
        UUID employeeId,
        String employeeFullName,
        String employeeCode,
        LocalDate startDate,
        LocalDate endDate,
        int days,
        LeaveType type,
        String reason,
        LeaveStatus status,
        LocalDate createdAt,
        String managerComment
) {
}