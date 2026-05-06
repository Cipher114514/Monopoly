const gameService = {
  async rollDice(gameId) {
    return { dice: [3, 5], position: 8 };
  },
  async buyProperty(gameId, propertyId) {
    return { success: true };
  }
};
export default gameService;