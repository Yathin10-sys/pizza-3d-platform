const { registerSchema, loginSchema } = require('../validators/schemas');

describe('Auth Validators', () => {
  describe('Register Schema Validation', () => {
    it('should validate a correct registration payload', () => {
      const validPayload = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890',
        password: 'password123',
        confirmPassword: 'password123'
      };
      const { error } = registerSchema.validate(validPayload);
      expect(error).toBeUndefined();
    });

    it('should fail if passwords do not match', () => {
      const invalidPayload = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890',
        password: 'password123',
        confirmPassword: 'password1234'
      };
      const { error } = registerSchema.validate(invalidPayload);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('Passwords must match');
    });

    it('should fail if email is invalid', () => {
      const invalidPayload = {
        name: 'John Doe',
        email: 'johnexample.com',
        phone: '1234567890',
        password: 'password123',
        confirmPassword: 'password123'
      };
      const { error } = registerSchema.validate(invalidPayload);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('email');
    });

    it('should fail if phone is not 10 digits', () => {
      const invalidPayload = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '123456789',
        password: 'password123',
        confirmPassword: 'password123'
      };
      const { error } = registerSchema.validate(invalidPayload);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('Phone number must be a valid 10-digit number');
    });
  });

  describe('Login Schema Validation', () => {
    it('should validate correct login payload', () => {
      const validPayload = {
        email: 'john@example.com',
        password: 'password123',
        rememberMe: true
      };
      const { error } = loginSchema.validate(validPayload);
      expect(error).toBeUndefined();
    });

    it('should fail on missing password', () => {
      const invalidPayload = {
        email: 'john@example.com'
      };
      const { error } = loginSchema.validate(invalidPayload);
      expect(error).toBeDefined();
    });
  });
});
