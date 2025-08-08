// AUTH INPUT VALIDATORS
// username validator
export function validateUsername(value: string): string | undefined {
    if (!value.trim()) {
        return "Username is required.";
    }
    if (value.trim().length < 6) {
        return "Username must be at least 6 characters.";
    }

    if (value.trim().length > 15) {
        return "Username cannot exceed 15 characters.";
    }

    // Allow alphanumeric characters, underscores, and hyphens
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(value.trim())) {
        return "Username can only contain letters, numbers, underscores, and hyphens.";
    }

    return undefined;
}

// bio validator
export function validateBio(value: string): string | undefined {
    if (value.length > 100) {
        return "Bio cannot exceed 100 characters.";
    }
    return undefined;
}

// email validator
export function validateEmail(value: string): string | undefined {
    if (!value.trim()) {
        return "Email is required.";
    }
    // Simple email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value.trim())) {
        return "Enter a valid email address.";
    }
    return undefined;
}

// password validator
export function validatePassword(value: string): string | undefined {
    if (!value) {
        return "Password is required.";
    }
    if (value.length < 8) {
        return "Password must be at least 8 characters.";
    }
    // Require at least 1 number
    if (!/\d/.test(value)) {
        return "Password must contain at least one number.";
    }
    // Require at least 1 special character from accepted set
    const specialCharRegex = /[!@#$%^&*()_\-+={}[\]|:;"'<>,.?/]/;
    if (!specialCharRegex.test(value)) {
        return "Password must include at least one special character.";
    }
    return undefined;
}

// confirm password validator
export function validateConfirmPassword(password: string, confirm: string): string | undefined {
    if (!confirm) {
        return "Please confirm your password.";
    }
    if (password !== confirm) {
        return "Passwords do not match.";
    }
    return undefined;
}

// CREATE WORKOUT INPUT VALIDATORS
// workout name validator
export function validateWorkoutName(value: string): string | undefined {
    if (!value.trim()) {
        return "Workout name is required.";
    }
    if (value.trim().length < 3) {
        return "Workout name must be at least 3 characters.";
    }
    if (value.trim().length > 50) {
        return "Workout name cannot exceed 50 characters.";
    }
    return undefined;
}

// workout description validator
export function validateWorkoutDescription(value: string): string | undefined {
    if (value.trim().length > 75) {
        return "Description cannot exceed 75 characters.";
    }
    return undefined;
}

// exercise title validator
export function validateExerciseTitle(value: string): string | undefined {
    if (!value.trim()) {
        return "Exercise title is required.";
    }
    if (value.trim().length < 3) {
        return "Exercise title must be at least 3 characters.";
    }
    if (value.trim().length > 50) {
        return "Exercise title cannot exceed 50 characters.";
    }
    return undefined;
}

// set input validator
export function validateSets(value: string): string | undefined {
    const num = Number(value);
    if (!value.trim()) {
        return "Set count is required.";
    }
    if (isNaN(num) || !Number.isInteger(num) || num < 1) {
        return "Sets must be a positive integer.";
    }
    if (num > 25) {
        return "Sets cannot exceed 25.";
    }
    return undefined;
}

// rep input validator
export function validateReps(value: string): string | undefined {
    const num = Number(value);
    if (!value.trim()) {
        return "Rep count is required.";
    }
    if (isNaN(num) || !Number.isInteger(num) || num < 1) {
        return "Reps must be a positive integer.";
    }
    if (num > 50) {
        return "Reps cannot exceed 50.";
    }
    return undefined;
}

// duration input validator
export function validateDuration(value: string): string | undefined {
    const num = Number(value);
    if (!value.trim()) {
        return "Duration is required.";
    }
    if (isNaN(num) || !Number.isInteger(num) || num < 1) {
        return "Duration must be a positive integer.";
    }
    if (num > 300) {
        return "Duration cannot exceed 300 minutes.";
    }
    return undefined;
}

// distance input validator
export function validateDistance(value: string): string | undefined {
    const num = Number(value);
    if (!value.trim()) {
        return "Distance is required.";
    }
    if (isNaN(num) || num <= 0) {
        return "Distance must be a positive number.";
    }
    if (num > 100) {
        return "Distance cannot exceed 100 miles.";
    }
    return undefined;
}

// INTERACTION INPUT VALIDATORS
// comment content validator
export function validateCommentContent(value: string): string | undefined {
    if (!value.trim()) {
        return "Comment cannot be empty.";
    }
    if (value.length > 250) {
        return "Comment cannot exceed 250 characters.";
    }
    return undefined;
}