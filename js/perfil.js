document.addEventListener("DOMContentLoaded", async () => {

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

  document.getElementById("nome").innerText = data.nome;
  document.getElementById("email").innerText = data.email;

});

async function logout(){
  await supabaseClient.auth.signOut();
  window.location.href = "login.html";
}