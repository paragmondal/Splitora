const INR_FORMATTER = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatNumber = (value, digits = 1) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return "0";
  return num.toFixed(digits).replace(/\.0+$/, "").replace(/(\.\d*[1-9])0+$/, "$1");
};

export function formatINR(amount) {
  const value = Number(amount);
  return INR_FORMATTER.format(Number.isFinite(value) ? value : 0);
}

export function formatCompact(amount) {
  const value = Number(amount);
  const safeValue = Number.isFinite(value) ? value : 0;
  const abs = Math.abs(safeValue);
  const sign = safeValue < 0 ? "-" : "";

  if (abs < 1000) {
    return `${sign}₹${formatNumber(abs, 2)}`;
  }

  if (abs < 100000) {
    return `${sign}₹${formatNumber(abs / 1000)}K`;
  }

  if (abs < 10000000) {
    return `${sign}₹${formatNumber(abs / 100000)}L`;
  }

  return `${sign}₹${formatNumber(abs / 10000000)}Cr`;
}

export default formatINR;
