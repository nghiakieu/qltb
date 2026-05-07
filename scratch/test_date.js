
// Mock the behavior of new Date() and toLocaleString
const dateStr = "2023-10-27T10:00:00"; // Naive string from backend (actually ICT)
const d = new Date(dateStr); 

console.log("Date string:", dateStr);
console.log("Parsed Date (local):", d.toString());
console.log("Formatted (Asia/Ho_Chi_Minh):", d.toLocaleString('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
}));
