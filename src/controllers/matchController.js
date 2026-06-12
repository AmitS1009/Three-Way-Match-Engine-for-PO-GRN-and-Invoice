const { getMatchResult } = require('../utils/matchService');

async function getMatchByPoNumber(req, res) {
  try {
    const { poNumber } = req.params;
    
    if (!poNumber) {
      return res.status(400).json({ error: 'PO number is required' });
    }

    const matchResult = await getMatchResult(poNumber);
    
    res.status(200).json(matchResult);
  } catch (error) {
    console.error('Error getting match result:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

module.exports = {
  getMatchByPoNumber
};
