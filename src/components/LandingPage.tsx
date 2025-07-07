interface LandingPageProps {
  onNavigateToMenu: () => void
}

export default function LandingPage({ onNavigateToMenu }: LandingPageProps) {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-6" style={{ background: 'linear-gradient(to bottom, #5BA1FF 0%, #0B73FE 100%)' }}>
      <div className="max-w-sm mx-auto text-center">
        {/* Top Logo - Food Icon */}
        <div className="mb-8">
          <img 
            src="/logo_aero2.svg" 
            alt="Aero Lunch Food Icon" 
            className="w-40 h-40 mx-auto mb-6 object-contain"
          />
        </div>

        {/* Airplane Logo */}
        <div className="mb-1">
          <img 
            src="/logo_aero1.svg" 
            alt="Aero Lunch Airplane" 
            className="w-72 h-36 mx-auto mb-0 object-contain"
          />
        </div>

        {/* Title */}
        <div className="mb-4">
          <h1 className="text-5xl font-bold mb-3">
            <span className="text-orange-400">Aero</span>
            <span className="text-white"> Lunch</span>
          </h1>
          <p className="text-white text-lg font-medium opacity-90">
            Доставка от 30 минут
          </p>
        </div>

        {/* CTA Button */}
        <div className="mt-16 mb-6">
          <button 
            onClick={onNavigateToMenu}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xl py-4 px-12 rounded-3xl w-full max-w-xs mx-auto transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Сделать заказ
          </button>
        </div>

        {/* Bottom Text */}
        <p className="text-white text-sm opacity-75 leading-relaxed">
          Быстрая подача прямо на борт самолета
        </p>
      </div>
    </div>
  )
} 