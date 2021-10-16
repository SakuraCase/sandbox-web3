import React from 'react';

export function Approve({ approve, contract }) {
  return (
    <div>
      <form
        onSubmit={(event) => {
          // This function just calls the transferTokens callback with the
          // form's data.
          event.preventDefault();

          const formData = new FormData(event.target);
          const contractAddress = contract
            ? contract
            : formData.get('contractAddress');
          const amount = formData.get('amount');

          if (contractAddress && amount) {
            approve(contractAddress, amount);
          }
        }}
      >
        {!contract && (
          <div className="form-group">
            <label>Contract Address</label>
            <input
              className="form-control"
              type="text"
              name="contractAddress"
              placeholder="contract"
              required
            />
          </div>
        )}
        <div className="form-group">
          <label>Amount</label>
          <input
            className="form-control"
            type="number"
            step="0.01"
            name="amount"
            placeholder="ether"
            required
          />
        </div>
        <div className="form-group">
          <input className="btn btn-primary" type="submit" value="Approve" />
        </div>
      </form>
    </div>
  );
}
