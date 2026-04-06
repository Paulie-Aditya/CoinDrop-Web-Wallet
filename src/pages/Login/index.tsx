export const Login = () => {
  const handleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/discord`;
  };

  return (
    <div>
      <button onClick={handleLogin}>Login with Discord</button>
    </div>
  );
};
