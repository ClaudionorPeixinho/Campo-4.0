document.addEventListener("DOMContentLoaded", async () => {

  const { data: { session } } = await supabaseClient.auth.getSession();

  if (!session) {
    window.location.href = "login.html";
  }

});

document.getElementById("btnLogout")
.addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  window.location.href = "login.html";
});