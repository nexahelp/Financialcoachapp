FinCoach App: Aplicación de Radiografía Financiera

Este proyecto es una aplicación frontend de React diseñada para coaches financieros, que utiliza Supabase como backend (Base de Datos y Autenticación) y está optimizada para ser desplegada en Vercel.

🚀 Guía Rápida de Implementación

1. Configuración de Supabase

Antes de desplegar, debes configurar tu base de datos en Supabase.

A. Variables de Entorno

Ve a tu proyecto Supabase y obtén tu Project URL y Anon Public Key.

Abre el archivo src/FinancialCoachApp.jsx y reemplaza los valores vacíos en la sección de configuración:

const SUPABASE_URL = 'TU_URL_DEL_PROYECTO'; 
const SUPABASE_ANON_KEY = 'TU_CLAVE_ANON_PUBLICA';


Nota: En un entorno de producción (Vercel), se recomienda usar Variables de Entorno para ocultar estas claves.

B. Esquema de la Base de Datos (Tablas Recomendadas)

Ejecuta el siguiente SQL en el SQL Editor de Supabase.

-- Tabla para los Coaches (Autenticación manejada por Supabase Auth)
-- No se requiere una tabla 'coaches' si solo usas la tabla 'auth.users'

-- 1. Tabla de Clientes
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES auth.users(id) NOT NULL, -- El coach dueño del cliente
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'Activo'
);

-- 2. Tabla de Radiografías Financieras (Histórico)
CREATE TABLE financial_xrays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  monthly_income NUMERIC,
  monthly_expenses NUMERIC,
  current_assets NUMERIC,
  current_liabilities NUMERIC,
  savings_goal NUMERIC,
  risk_tolerance TEXT -- Baja, Moderada, Alta
);

-- 3. Tabla de Planes Mensuales (Seguimiento)
CREATE TABLE monthly_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) NOT NULL,
  month DATE NOT NULL,
  focus TEXT NOT NULL,
  status TEXT DEFAULT 'Pendiente' -- Pendiente, En Progreso, Completado
);


2. Despliegue en Vercel

Crea un Repositorio en GitHub. Sube todos los archivos (FinancialCoachApp.jsx, package.json, etc.).

Conecta Vercel. Inicia sesión en Vercel, haz clic en "New Project" e importa el repositorio de GitHub que acabas de crear.

Configuración del Build. Vercel detectará que es un proyecto React (Vite) y usará automáticamente la configuración de package.json. No se requieren pasos adicionales a menos que uses una estructura de carpetas personalizada.

Despliega. Confirma y Vercel construirá y desplegará tu aplicación.
