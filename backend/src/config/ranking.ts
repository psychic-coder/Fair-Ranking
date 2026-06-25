// Configurable constants for ranking formula
export const RANKING_WEIGHTS = {
  TOTAL_AMOUNT: 0.6,
  CAPPED_TRANSACTION_COUNT: 0.3,   // will multiply with TRANSACTION_WEIGHT
  CONSISTENCY_BONUS: 0.1,
};

export const TRANSACTION_WEIGHT = 10;   // points per transaction (up to cap)
export const CAP_TRANSACTION_COUNT = 50;
export const MAX_CONSISTENCY_DAYS = 30;

// For abuse detection
export const ABUSE_VELOCITY_WINDOW_MINUTES = 5;
export const ABUSE_VELOCITY_MAX_TRANSACTIONS = 20; // flag if >20 transactions in 5 min

export const AMOUNT_UPPER_BOUND = 1_000_000;
