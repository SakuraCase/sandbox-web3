import React from 'react';

export function Allowance({ allowance }) {
  return (
    <div>
      <h4>Allowance</h4>
      <form
        onSubmit={(event) => {
          // This function just calls the transferTokens callback with the
          // form's data.
          event.preventDefault();

          const formData = new FormData(event.target);
          const contractAddress = formData.get('contractAddress');

          if (contractAddress) {
            allowance(contractAddress);
          }
        }}
      >
        <div className="form-group">
          <label>Contract Address</label>
          <input
            className="form-control"
            type="text"
            name="contractAddress"
            placeholder="contract address"
            required
          />
        </div>
        <div className="form-group">
          <input className="btn btn-primary" type="submit" value="Allowance" />
        </div>
      </form>
    </div>
  );
}
