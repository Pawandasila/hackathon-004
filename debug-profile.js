// Temporary debug script to check profile completion
// You can run this in the browser console to see what's happening

console.log('Profile Completion Debug');

// Check current user state
if (window.__CLERK_USER__ || window.Clerk?.user) {
  const user = window.__CLERK_USER__ || window.Clerk?.user;
  console.log('Clerk User:', {
    firstName: user.firstName,
    lastName: user.lastName,
    imageUrl: user.imageUrl,
    phoneNumbers: user.phoneNumbers,
    publicMetadata: user.publicMetadata,
    unsafeMetadata: user.unsafeMetadata
  });
} else {
  console.log('No Clerk user found');
}

// You can also check localStorage for any cached profile data
console.log('LocalStorage profile data:', localStorage.getItem('profileReminderDismissed'));