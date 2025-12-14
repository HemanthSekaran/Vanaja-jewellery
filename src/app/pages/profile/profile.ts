import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [ReactiveFormsModule],
    templateUrl: './profile.html',
})
export class Profile implements OnInit {

    authService = inject(AuthService);
    apiService = inject(ApiService);
    router = inject(Router);
    fb = inject(FormBuilder);
    location = inject(Location);

    profileForm: FormGroup;
    isSubmitting = false;

    goBack() {
        this.location.back();
    }

    constructor() {
        this.profileForm = this.fb.group({
            name: ['', Validators.required],
            email: [{ value: '', disabled: true }, Validators.required],
            phone: [''],
            address: ['']
        });
    }

    ngOnInit() {

        // Fallback to session storage if signal isn't ready (though it should be)
        const storedUser = sessionStorage.getItem('user');
        if (storedUser) {
            let parsedUser = JSON.parse(storedUser);
            // Handle case where user data is wrapped in a 'user' property (common issue)
            if (parsedUser && parsedUser.user) {
                parsedUser = parsedUser.user;
            }

            this.profileForm.patchValue({
                name: parsedUser.name,
                email: parsedUser.email,
                phone: parsedUser.phone || '',
                address: parsedUser.address || ''
            });
        } else {
            this.router.navigate(['/login']);
        }
    }

    async onSubmit() {
        if (this.profileForm.invalid) return;

        this.isSubmitting = true;
        try {
            const updatedData = this.profileForm.getRawValue();
            await this.apiService.updateProfile(updatedData);

            // Refresh profile data
            const profileResponse = await this.apiService.getProfile();
            let userData = profileResponse.data;
            if (userData && userData.data) {
                userData = userData.data;
            }

            this.authService.currentUser.set(userData);
            sessionStorage.setItem('user', JSON.stringify(userData));

            alert("Profile updated successfully!");
        } catch (error) {
            console.error("Profile Update Error:", error);
            alert("Failed to update profile.");
        } finally {
            this.isSubmitting = false;
        }
    }
}
