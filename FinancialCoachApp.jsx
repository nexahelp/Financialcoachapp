import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, User, LogOut, Aperture, DollarSign, BarChart2, CheckCircle, Plus } from 'lucide-react';
// Importa el cliente de Supabase (necesitarás instalar la librería @supabase/supabase-js)
// Si estás usando Vite o un bundler moderno, este import funcionará.
// import { createClient } from '@supabase/supabase-js'; 

// =======================================================
// 1. CONFIGURACIÓN DE SUPABASE (¡IMPORTANTE!)
//    REEMPLAZA ESTOS VALORES CON LOS REALES DE TU PROYECTO SUPABASE
// =======================================================
const SUPABASE_URL = 'https://xhpkovudinbqrbdvuzrb.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhocGtvdnVkaW5icXJiZHZ1enJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3ODkxOTQsImV4cCI6MjA3NjM2NTE5NH0.J1Ad1N8fWShrNvvB6VCE6jzBoeB7gW2VO4P3N48hQUQ'; 

// Inicialización del cliente (Usamos un Mock para la ejecución en este entorno)
// En un proyecto real, usarías: const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabase = {
  auth: {
    getSession: () => new Promise(resolve => setTimeout(() => resolve({ data: { session: { user: { id: 'user-coach-123', email: 'coach@ejemplo.com' } } } }), 100)),
    signInWithPassword: (credentials) => new Promise(resolve => {
      console.log('Simulando inicio de sesión:', credentials);
      if (credentials.email === 'coach@ejemplo.com' && credentials.password === 'password') {
        resolve({ data: { user: { id: 'user-coach-123', email: credentials.email } }, error: null });
      } else {
        resolve({ data: { user: null }, error: { message: 'Credenciales inválidas simuladas.' } });
      }
    }),
    signUp: (credentials) => new Promise(resolve => {
      console.log('Simulando registro:', credentials);
      resolve({ data: { user: { id: 'user-coach-123', email: credentials.email } }, error: null });
    }),
    signOut: () => new Promise(resolve => {
      console.log('Simulando cierre de sesión');
      resolve({ error: null });
    }),
    onAuthStateChange: (callback) => { 
        // Simulación para mantener el estado
        setTimeout(() => callback('INITIAL_SESSION', { session: { user: { id: 'user-coach-123', email: 'coach@ejemplo.com' } } }), 100);
        return { data: { subscription: { unsubscribe: () => {} } } };
    }
  },
  from: (tableName) => ({
    // Simulación de operaciones CRUD
    select: () => ({
      eq: (key, value) => new Promise(resolve => {
        // Mock data para clientes (Filtramos por coach_id simulado)
        if (tableName === 'clients' && key === 'coach_id' && value === 'user-coach-123') {
            const mockClients = [
              { id: 'cli-001', name: 'Javier Pérez', email: 'javier@ejemplo.com', status: 'Activo', last_checkup: '2024-09-15' },
              { id: 'cli-002', name: 'Elena Gómez', email: 'elena@ejemplo.com', status: 'En Pausa', last_checkup: '2024-08-01' },
            ];
            resolve({ data: mockClients, error: null });
        } else if (tableName === 'clients') {
             resolve({ data: [], error: null });
        } else {
            resolve({ data: [], error: null });
        }
      }),
    }),
    insert: (data) => new Promise(resolve => {
      console.log(`Simulando inserción en ${tableName}:`, data);
      resolve({ data: [{ id: `new-${tableName}-id` }], error: null });
    }),
  }),
};

// =======================================================
// 2. DATOS Y ESTRUCTURAS
// =======================================================
const FinancialXRayTemplate = {
  current_assets: 0,
  current_liabilities: 0,
  monthly_income: 0,
  monthly_expenses: 0,
  savings_goal: 0,
  risk_tolerance: 'Moderada',
};

const navItems = [
  { name: 'Dashboard', icon: BarChart2, view: 'dashboard' },
  { name: 'Clientes', icon: User, view: 'client_list' },
  { name: 'Nueva Radiografía', icon: Plus, view: 'add_xray' },
  { name: 'Perfil', icon: Aperture, view: 'profile' },
];

// =======================================================
// 3. COMPONENTES REUTILIZABLES DE UI
// =======================================================

const Card = ({ children, title, className = '' }) => (
  <div className={`bg-white p-6 rounded-xl shadow-lg border border-gray-100 ${className}`}>
    {title && <h2 className="text-xl font-bold text-gray-800 mb-4">{title}</h2>}
    {children}
  </div>
);

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, type = 'button' }) => {
  const baseStyle = "px-4 py-2 font-semibold transition-all duration-200 rounded-lg focus:outline-none focus:ring-4 disabled:opacity-50";
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500/50 shadow-md hover:shadow-lg",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400/50",
    danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500/50",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${baseStyle} ${variants[variant]} ${className}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

// =======================================================
// 4. VISTAS PRINCIPALES
// =======================================================

// --- VISTA DE AUTENTICACIÓN ---
const AuthView = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let response;
      if (isLogin) {
        response = await supabase.auth.signInWithPassword({ email, password });
      } else {
        response = await supabase.auth.signUp({ email, password });
      }

      if (response.error) {
        setError(response.error.message);
      } else if (response.data.user) {
        onAuthSuccess(response.data.user);
      } else {
        // En el caso de registro, Supabase puede no devolver user inmediatamente
        // sino que puede esperar la confirmación por email.
        if (!isLogin) {
             setError('Revisa tu email para confirmar el registro (simulado).');
        } else {
            setError('Error desconocido en la autenticación.');
        }
      }
    } catch (e) {
      setError('Error de red o del sistema.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <Card title={isLogin ? 'Iniciar Sesión (Coach)' : 'Crear Cuenta (Coach)'} className="w-full max-w-md">
        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="email"
            placeholder="Correo Electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Cargando...' : isLogin ? 'Ingresar' : 'Registrarse'}
          </Button>
        </form>
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            {isLogin ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-indigo-600 font-medium hover:text-indigo-500 transition-colors"
            >
              {isLogin ? 'Regístrate aquí' : 'Inicia Sesión'}
            </button>
          </p>
          <p className="text-xs text-gray-400 mt-2">
            (Usa coach@ejemplo.com / password para probar el login simulado)
          </p>
        </div>
      </Card>
    </div>
  );
};

// --- VISTA DE LISTA DE CLIENTES ---
const ClientListView = ({ clients, setView, setSelectedClient }) => {
  const handleViewClient = (client) => {
    setSelectedClient(client);
    setView('client_details');
  };

  return (
    <Card title="Mis Clientes" className="flex-1">
      <Button onClick={() => setView('add_xray')} className="mb-4">
        <Plus className="w-5 h-5 mr-2" /> Agregar Nueva Radiografía
      </Button>
      <div className="space-y-3">
        {clients.map(client => (
          <div
            key={client.id}
            className="flex justify-between items-center p-4 bg-gray-50 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleViewClient(client)}
          >
            <div>
              <p className="text-lg font-semibold text-indigo-700">{client.name}</p>
              <p className="text-sm text-gray-500">{client.email}</p>
            </div>
            <div className="text-right">
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${client.status === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {client.status}
              </span>
              <p className="text-xs text-gray-400 mt-1">Última Revisión: {client.last_checkup}</p>
            </div>
          </div>
        ))}
        {clients.length === 0 && <p className="text-gray-500 text-center py-8">No hay clientes registrados aún.</p>}
      </div>
    </Card>
  );
};

// --- VISTA DE RADIOGRAFÍA FINANCIERA (FORMULARIO) ---
const FinancialXRayView = ({ setView, coachId }) => {
  const [formData, setFormData] = useState(FinancialXRayTemplate);
  const [clientData, setClientData] = useState({ name: '', email: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleClientChange = (e) => {
    const { name, value } = e.target;
    setClientData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Datos del cliente con ID del coach
    const clientToInsert = { ...clientData, coach_id: coachId };

    try {
      // 1. Crear o encontrar el cliente
      const { data: clientInsertData, error: clientError } = await supabase.from('clients').insert(clientToInsert);

      if (clientError) {
        alert('Error al guardar cliente: ' + clientError.message);
        setLoading(false);
        return;
      }

      const clientId = clientInsertData[0].id;

      // 2. Insertar la radiografía vinculada al cliente
      const xrayResponse = await supabase.from('financial_xrays').insert({
        client_id: clientId,
        ...formData,
        date: new Date().toISOString().split('T')[0]
      });

      if (xrayResponse.error) {
        alert('Error al guardar radiografía: ' + xrayResponse.error.message);
      } else {
        alert('Radiografía y cliente guardados con éxito!');
        setView('client_list');
      }

    } catch (error) {
      console.error('Error en el guardado:', error);
      alert('Ocurrió un error al intentar guardar los datos.');
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (label, name, type = 'number') => (
    <div className="col-span-12 sm:col-span-6">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="mt-1 flex rounded-lg shadow-sm">
        {type === 'number' && (
          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
            $
          </span>
        )}
        <input
          type={type}
          name={name}
          value={type === 'number' ? formData[name].toString() : formData[name]}
          onChange={handleChange}
          required
          className={`flex-1 block w-full rounded-r-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 ${type === 'number' ? '' : 'rounded-lg border'}`}
          min={type === 'number' ? 0 : undefined}
        />
      </div>
    </div>
  );

  return (
    <Card title="Crear Nueva Radiografía Financiera" className="flex-1">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-12 gap-6 p-4 border rounded-lg bg-indigo-50">
            <h3 className="col-span-12 text-lg font-bold text-indigo-800 border-b pb-2">Datos del Cliente</h3>
            <div className="col-span-12 sm:col-span-6">
                <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
                <input type="text" name="name" value={clientData.name} onChange={handleClientChange} required className="mt-1 block w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"/>
            </div>
            <div className="col-span-12 sm:col-span-6">
                <label className="block text-sm font-medium text-gray-700">Correo Electrónico (Login)</label>
                <input type="email" name="email" value={clientData.email} onChange={handleClientChange} required className="mt-1 block w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"/>
            </div>
        </div>

        <div className="grid grid-cols-12 gap-6 p-4 border rounded-lg bg-white">
            <h3 className="col-span-12 text-lg font-bold text-gray-800 border-b pb-2">Detalles Financieros</h3>
            {renderInput('Ingreso Mensual Neto', 'monthly_income')}
            {renderInput('Gastos Mensuales Fijos/Variables', 'monthly_expenses')}
            {renderInput('Activos Corrientes (Efectivo, Inversiones Líquidas)', 'current_assets')}
            {renderInput('Pasivos Corrientes (Deudas Corto Plazo)', 'current_liabilities')}
            {renderInput('Objetivo de Ahorro Mensual', 'savings_goal')}

            <div className="col-span-12 sm:col-span-6">
              <label className="block text-sm font-medium text-gray-700">Tolerancia al Riesgo</label>
              <select
                name="risk_tolerance"
                value={formData.risk_tolerance}
                onChange={handleChange}
                className="mt-1 block w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="Baja">Baja</option>
                <option value="Moderada">Moderada</option>
                <option value="Alta">Alta</option>
              </select>
            </div>
        </div>

        <div className="flex justify-end space-x-4 pt-4">
          <Button type="button" variant="secondary" onClick={() => setView('client_list')}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar Radiografía'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

// --- VISTA DE DETALLES DEL CLIENTE ---
const ClientDetailsView = ({ client, setView }) => {
  const mockXRay = {
    monthly_income: 4500,
    monthly_expenses: 3000,
    current_assets: 25000,
    current_liabilities: 8000,
    savings_goal: 500,
    net_worth: 17000,
    savings_rate: '11.1%', 
  };

  const mockPlan = [
    { month: 'Octubre 2024', status: 'Completado', focus: 'Reestructuración de deuda de tarjeta de crédito.' },
    { month: 'Noviembre 2024', status: 'En Progreso', focus: 'Apertura de cuenta de inversión de bajo riesgo.' },
    { month: 'Diciembre 2024', status: 'Pendiente', focus: 'Revisión de seguro de vida y gastos de fin de año.' },
  ];

  return (
    <Card title={`Detalles y Plan de ${client.name}`} className="flex-1">
      <p className="text-gray-500 mb-6">Última Revisión: {client.last_checkup}</p>

      {/* Resumen de Radiografía */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-indigo-600 mb-3 flex items-center"><Aperture className="w-5 h-5 mr-2" /> Radiografía Financiera (Simulada)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatBox title="Ingresos Netos" value={`$${mockXRay.monthly_income.toLocaleString()}`} icon={DollarSign} color="text-green-600" />
          <StatBox title="Gastos Mensuales" value={`$${mockXRay.monthly_expenses.toLocaleString()}`} icon={DollarSign} color="text-red-600" />
          <StatBox title="Patrimonio Neto" value={`$${mockXRay.net_worth.toLocaleString()}`} icon={BarChart2} color="text-indigo-600" />
          <StatBox title="Tasa de Ahorro" value={mockXRay.savings_rate} icon={RefreshCw} color="text-yellow-600" />
        </div>
      </div>

      {/* Plan Mensual */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-indigo-600 mb-3 flex items-center"><CheckCircle className="w-5 h-5 mr-2" /> Plan Mensual de Seguimiento</h3>
        <div className="space-y-4">
          {mockPlan.map((plan, index) => (
            <div key={index} className="p-4 border-l-4 border-indigo-400 bg-white shadow-sm rounded-lg">
              <div className="flex justify-between items-center">
                <p className="text-lg font-semibold">{plan.month}</p>
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${plan.status === 'Completado' ? 'bg-green-100 text-green-800' : plan.status === 'En Progreso' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                  {plan.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">Foco: {plan.focus}</p>
            </div>
          ))}
        </div>
      </div>

      <Button onClick={() => setView('client_list')} variant="secondary">
        Volver a Clientes
      </Button>
    </Card>
  );
};

const StatBox = ({ title, value, icon: Icon, color }) => (
  <Card className="flex items-center space-x-4 p-4 border-l-4 border-indigo-200">
    <Icon className={`w-8 h-8 ${color}`} />
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  </Card>
);

// --- VISTA DASHBOARD (PRINCIPAL) ---
const DashboardView = ({ setView, clients }) => (
  <div className="space-y-8">
    <Card title="Resumen del Coach">
      <p className="text-gray-600">Bienvenido de vuelta. Hoy es un buen día para ayudar a tus clientes a alcanzar la libertad financiera.</p>
    </Card>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatBox title="Clientes Activos" value={clients.filter(c => c.status === 'Activo').length} icon={User} color="text-indigo-600" />
        <StatBox title="Radiografías Pendientes" value={3} icon={Aperture} color="text-yellow-600" />
        <StatBox title="Planes Completados" value={12} icon={CheckCircle} color="text-green-600" />
    </div>

    <ClientListView clients={clients} setView={setView} setSelectedClient={() => {}} />
  </div>
);


// =======================================================
// 5. COMPONENTE PRINCIPAL (App)
// =======================================================

const AppLayout = ({ user, children, onLogout, setView, currentView }) => {
  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-20 lg:w-64 bg-indigo-700 text-white flex flex-col p-3 shadow-2xl">
        <div className="mb-8 pt-2">
          <h1 className="text-2xl font-bold hidden lg:block">FinCoach App</h1>
          <Aperture className="w-8 h-8 lg:hidden mx-auto" />
        </div>
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <div
              key={item.view}
              onClick={() => setView(item.view)}
              className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${currentView === item.view ? 'bg-indigo-900 shadow-md' : 'hover:bg-indigo-600'}`}
            >
              <item.icon className="w-6 h-6 shrink-0" />
              <span className="ml-3 text-sm font-medium hidden lg:block">{item.name}</span>
            </div>
          ))}
        </nav>
        <div className="mt-auto pt-4 border-t border-indigo-600">
          <p className="text-sm font-medium hidden lg:block truncate">{user.email || 'Usuario'}</p>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center lg:justify-start p-3 mt-2 text-red-300 hover:bg-indigo-600 hover:text-white transition-colors rounded-lg"
          >
            <LogOut className="w-6 h-6" />
            <span className="ml-3 text-sm font-medium hidden lg:block">Salir</span>
          </button>
        </div>
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard'); // Vistas: 'dashboard', 'client_list', 'add_xray', 'client_details'
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);

  // 1. Manejo del estado de autenticación (Auth)
  useEffect(() => {
    // Escucha los cambios de estado de autenticación de Supabase
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          setUser(session.user);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    // Chequeo inicial de la sesión
    supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
            setUser(session.user);
        }
        setLoading(false);
    });

    return () => {
        // Limpiar el listener al desmontar el componente (importante en proyectos reales)
        authListener?.subscription.unsubscribe();
    };
  }, []);

  // 2. Carga de datos (Clientes)
  const fetchClients = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from('clients')
        .select('*')
        .eq('coach_id', user.id); // Asegura que solo se cargan los clientes del coach logueado

      if (error) {
        console.error('Error al cargar clientes:', error);
      } else {
        setClients(data);
      }
    } catch (e) {
      console.error('Error de red al cargar clientes:', e);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
        fetchClients();
    } else {
        setClients([]); // Limpiar clientes si no hay usuario
    }
  }, [user, fetchClients]);


  const handleAuthSuccess = (userData) => {
    setUser(userData);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setView('dashboard'); 
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-xl font-medium text-indigo-600">Cargando aplicación...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthView onAuthSuccess={handleAuthSuccess} />;
  }

  const renderView = () => {
    switch (view) {
      case 'client_list':
        return <ClientListView clients={clients} setView={setView} setSelectedClient={setSelectedClient} />;
      case 'add_xray':
        return <FinancialXRayView setView={setView} coachId={user.id} />;
      case 'client_details':
        if (selectedClient) {
          return <ClientDetailsView client={selectedClient} setView={setView} />;
        }
        return <DashboardView setView={setView} clients={clients} />; 
      case 'profile':
        return <Card title="Mi Perfil"><p>Correo del Coach: {user.email}</p><p className="text-sm text-gray-500 mt-2">ID de Usuario: {user.id}</p></Card>
      case 'dashboard':
      default:
        return <DashboardView setView={setView} clients={clients} />;
    }
  };

  return (
    <AppLayout user={user} onLogout={handleLogout} setView={setView} currentView={view}>
      {renderView()}
    </AppLayout>
  );
}
