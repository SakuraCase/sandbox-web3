import React from 'react';

export function Deposit({ deposit }) {
  return (
    <div>
      <h4>Deposit</h4>
      <form
        onSubmit={(event) => {
          // This function just calls the transferTokens callback with the
          // form's data.
          event.preventDefault();

          const formData = new FormData(event.target);
          const amount = formData.get('amount');

          if (amount) {
            deposit(amount);
          }
        }}
      >
        <div className="form-group">
          <label>Amount</label>
          <input
            className="form-control"
            type="number"
            step="0.01"
            name="amount"
            placeholder="1"
            required
          />
        </div>
        <div className="form-group">
          <input className="btn btn-primary" type="submit" value="Deposit" />
        </div>
      </form>
    </div>
  );
}
