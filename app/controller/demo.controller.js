module.exports = {
  getDemo: async (req, res) => {
    try {
      res.status(200).json({
        success: true,
        message: 'Hello world',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
};
