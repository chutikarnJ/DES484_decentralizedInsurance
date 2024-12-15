export const calculateRiskFactor = (
    vehicleAge: string,
    claimHistory: string,
    carUsageType: string,
    carCamera: string,
    location: string
  ): number => {
    let riskFactor = 1; // Base risk factor
  
    // Increase risk if the vehicle age is greater than 5 years
    if (parseInt(vehicleAge) > 5) riskFactor += 0.1;
  
    // Increase risk for every claim in claim history
    if (parseInt(claimHistory) > 0) riskFactor += 0.05 * parseInt(claimHistory);
  
    // If the car is used for commercial purposes, increase the risk
    if (carUsageType === "commercial") riskFactor += 0.2;
  
    // Decrease risk if the car has a camera
    if (carCamera === "Yes") riskFactor -= 0.1;
  
    // Location-based risk adjustment
    if (location === "Bangkok") riskFactor += 0.15;
    else if (location === "Perimeter") riskFactor += 0.05;
    else if (location === "Other") riskFactor += 0;
  
    return Math.max(riskFactor, 1); // Ensure the risk factor doesn't go below 1
  };
  