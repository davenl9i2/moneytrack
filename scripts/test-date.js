// Test current date
const now = new Date();
console.log('Current Date Object:', now);
console.log('ISO String:', now.toISOString());
console.log('ISO String split:', now.toISOString().split('T')[0]);
console.log('Local Date String:', now.toLocaleDateString());
console.log('Year:', now.getFullYear());
console.log('Month:', now.getMonth() + 1);
console.log('Date:', now.getDate());

// Manual format
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, '0');
const day = String(now.getDate()).padStart(2, '0');
const localDate = `${year}-${month}-${day}`;
console.log('Local formatted:', localDate);
