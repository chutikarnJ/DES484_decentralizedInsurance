import React from "react";

const policies = [
  { id: "1", name: "Type 1 - Comprehensive", premium: "10,000 THB" },
  { id: "2", name: "Type 2 - Standard", premium: "7,500 THB" },
  { id: "3", name: "Type 3 - Basic", premium: "5,000 THB" },
];

const InsurancePolicies: React.FC = () => {
  return (
    <div>
      <h1>Available Insurance Policies</h1>
      <ul>
        {policies.map((policy) => (
          <li key={policy.id}>
            <h3>{policy.name}</h3>
            <p>Premium: {policy.premium}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default InsurancePolicies;
