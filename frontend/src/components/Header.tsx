import { useMemo } from "react";

type HeaderProps = {
  unitLabel: string;
  userName: string;
  onLogout: () => void;
};

const Header = ({ unitLabel, userName, onLogout }: HeaderProps) => {
  const timeLabel = useMemo(() => new Date().toLocaleString("es-MX"), []);

  return (
    <header className="header">
      <div>
        <div className="header__title">Panel Administrativo</div>
        <div className="header__subtitle">{timeLabel}</div>
      </div>
      <div className="header__actions">
        <div className="header__pill">Unidad: {unitLabel}</div>
        <button className="header__button">Notificaciones</button>
        <div className="header__user">
          <div className="header__avatar">{userName.slice(0, 2)}</div>
          <div>
            <div className="header__user-name">{userName}</div>
            <button className="link" onClick={onLogout}>
              Cerrar sesion
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

