package com.hrplatform.app.modules.employee.entity;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name="departments")
public class Department {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable= false, unique=true)
    private String name;

    @Column(length=500)
    private String description;

    public Department(){

    }
    public Department(String name, String description){
        this.name=name;
        this.description=description;
    }
    public UUID getId(){
        return id;
    }
    public void setId(UUID id){
        this.id=id;
    }
    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }
    public String getDescription() {
        return description;
    }
    public void setDescription(String description) {
        this.description = description;
    }
}
