import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HoyPage } from './pages/HoyPage';
import { PlanPage } from './pages/PlanPage';
import { CalendarioPage } from './pages/CalendarioPage';
import { RegistroPage } from './pages/RegistroPage';
import { ProgresoPage } from './pages/ProgresoPage';
import { FuerzaPage } from './pages/FuerzaPage';
import { AjustesPage } from './pages/AjustesPage';
import { MasPage } from './pages/MasPage';
import { NoEncontradoPage } from './pages/NoEncontradoPage';

export default function App(): JSX.Element {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HoyPage />} />
        <Route path="plan" element={<PlanPage />} />
        <Route path="calendario" element={<CalendarioPage />} />
        <Route path="registro" element={<RegistroPage />} />
        <Route path="progreso" element={<ProgresoPage />} />
        <Route path="fuerza" element={<FuerzaPage />} />
        <Route path="ajustes" element={<AjustesPage />} />
        <Route path="mas" element={<MasPage />} />
        <Route path="*" element={<NoEncontradoPage />} />
      </Route>
    </Routes>
  );
}
