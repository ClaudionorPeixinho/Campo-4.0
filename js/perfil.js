document.addEventListener("DOMContentLoaded", async () => {
  if (!window.supabaseClient) {
    setTimeout(() => location.reload(), 1000);
    return;
  }

  const { data: { user } } = await supabaseClient.auth.getUser();

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const { data } = await supabaseClient
    .from("usuarios")
    .select("*")
    .eq("id", user.id)
    .single();

  if (data) {
    const nomeEl = document.getElementById("nome");
    const emailEl = document.getElementById("email");
    if (nomeEl) nomeEl.innerText = data.nome || "";
    if (emailEl) emailEl.innerText = data.email || "";
  }
});

async function logout(){
  try { await supabaseClient.auth.signOut(); } catch(e) {}
  try { localStorage.clear(); } catch(e) {}
  window.location.href = "login.html";
}