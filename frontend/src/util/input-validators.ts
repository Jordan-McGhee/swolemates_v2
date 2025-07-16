// AUTH INPUT VALIDATORS
// username validator
export function validateUsername(value: string): string | undefined {
    if (!value.trim()) {
        return "Username is required.";
    }
    if (value.trim().length < 6) {
        return "Username must be at least 6 characters.";
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