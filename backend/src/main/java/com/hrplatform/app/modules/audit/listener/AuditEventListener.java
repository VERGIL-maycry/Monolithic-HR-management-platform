package com.hrplatform.app.modules.audit.listener;

import com.hrplatform.app.modules.leave.event.LeaveApprovedEvent;
import com.hrplatform.app.modules.leave.event.LeaveRejectedEvent;
import com.hrplatform.app.modules.leave.event.LeaveRequestedEvent;
import com.hrplatform.app.modules.audit.service.AuditService;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Listens for the three leave events and creates audit logs.
 */
@Component
public class AuditEventListener {

    private final AuditService audit;

    public AuditEventListener(AuditService audit) {
        this.audit = audit;
    }

    /** Extract the client IP from the current request (fallback to "unknown"). */
    private String clientIp() {
        ServletRequestAttributes attrs =
                (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs == null) return "unknown";

        HttpServletRequest request = attrs.getRequest();
        return (request != null) ? request.getRemoteAddr() : "unknown";
    }

    @EventListener
    public void onRequested(LeaveRequestedEvent e) {
        String detail = String.format(
                "%s demande %d jour(s) du %s au %s",
                e.getEmployeeFullName(),
                e.getDays(),
                e.getStartDate(),
                e.getEndDate()
        );
        audit.log(e.getEmployeeEmail(), "LEAVE_REQUESTED", detail, clientIp());
    }

    @EventListener
    public void onApproved(LeaveApprovedEvent e) {
        String detail = String.format(
                "%s approuve %d jour(s) pour %s",
                e.getManagerEmail(),
                e.getDays(),
                e.getEmployeeFullName()
        );
        audit.log(e.getManagerEmail(), "LEAVE_APPROVED", detail, clientIp());
    }

    @EventListener
    public void onRejected(LeaveRejectedEvent e) {
        String detail = String.format(
                "%s refuse %d jour(s) pour %s",
                e.getManagerEmail(),
                e.getDays(),
                e.getEmployeeFullName()
        );
        audit.log(e.getManagerEmail(), "LEAVE_REJECTED", detail, clientIp());
    }
}