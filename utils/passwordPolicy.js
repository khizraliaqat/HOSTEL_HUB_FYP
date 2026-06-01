const PASSWORD_POLICY_MESSAGE = 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.';

function isStrongPassword(password) {
    if (typeof password !== 'string') return false;
    if (password.length < 8) return false;

    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);

    return hasUpper && hasLower && hasNumber && hasSpecial;
}

module.exports = {
    PASSWORD_POLICY_MESSAGE,
    isStrongPassword
};
