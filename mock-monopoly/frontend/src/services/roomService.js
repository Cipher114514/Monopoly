const roomService = {
  async getRooms() {
    return { rooms: [] };
  },
  async createRoom(name) {
    return { roomId: 'new-room-id' };
  },
  async joinRoom(roomId) {
    return { success: true };
  }
};
export default roomService;