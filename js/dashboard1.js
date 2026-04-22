document.addEventListener("DOMContentLoaded", async () => {

  const { data: { user } } = await supabaseClient.auth.getUser();

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const { count } = await supabaseClient
    .from("apontamentos_entregas_cana")
    .select("*", { count: "exact", head: true });

  document.getElementById("totalCargas").innerText = count || 0;

});