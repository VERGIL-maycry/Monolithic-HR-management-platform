package com.hrplatform.app.modules.leave.dto;

// Permet au manager d'ajouter un motif/commentaire lors de l'acceptation ou du refus
public record ReviewLeaveRequest(
        String comment
) {
}