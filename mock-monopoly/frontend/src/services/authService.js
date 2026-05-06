const authService = {
  async login(email, password) {
    return { token: 'mock-token', user: { email } };
  },
  async register(email, password) {
    return { token: 'mock-token', user: { email } };
  },
  logout() {
    return;
  }
};
export default authService;