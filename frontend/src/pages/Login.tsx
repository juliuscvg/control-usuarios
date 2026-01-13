import { FormEvent, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("admin@demo.com");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    localStorage.setItem("demo-token", "demo-session");
    localStorage.setItem("demo-actor", email);
    const redirect =
      (location.state as { from?: { pathname?: string } })?.from?.pathname ??
      "/admin";
    navigate(redirect, { replace: true });
  };

  return (
    <div className="login">
      <div className="login__panel">
        <div className="login__brand">
          <div className="login__logo">CH</div>
          <div>
            <h1>Control de Usuarios</h1>
            <p>Acceso institucional a perfiles y permisos.</p>
          </div>
        </div>

        <form className="login__form" onSubmit={handleSubmit}>
          <label className="field">
            Correo institucional
            <input
              className="input"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              required
            />
          </label>
          <label className="field">
            Contrasena
            <input
              className="input"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              placeholder="••••••"
              required
            />
          </label>
          <button className="button" type="submit">
            Ingresar
          </button>
        </form>
        <div className="login__hint">
          Usuarios demo: admin@demo.com / user@demo.com
        </div>
      </div>
      <div className="login__aside">
        <div className="login__card">
          <h2>Seguridad y trazabilidad</h2>
          <p>
            Administra perfiles, permisos y alcances por unidad hospitalaria con
            visibilidad total de origen y cobertura.
          </p>
          <div className="login__stats">
            <div>
              <strong>AA</strong>
              <span>Accesibilidad</span>
            </div>
            <div>
              <strong>24/7</strong>
              <span>Disponibilidad</span>
            </div>
            <div>
              <strong>GovTech</strong>
              <span>Confianza publica</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

