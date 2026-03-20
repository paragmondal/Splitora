const emitToGroup = (groupId, event, data) => {
  if (global.io) global.io.to(`group-${groupId}`).emit(event, data)
}
module.exports = { emitToGroup }
