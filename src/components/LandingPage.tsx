interface LandingPageProps {
  onNavigateToMenu: () => void
}

export default function LandingPage({ onNavigateToMenu }: LandingPageProps) {
  return (
    <div className="fit-screen safe-area-inset flex flex-col justify-between items-center px-4 sm:px-6 bg-gradient-to-b from-primary-900 to-primary-950">
      {/* Основной контент - центрированный */}
      <div className="flex-1 flex flex-col justify-center items-center text-center">
        {/* Top Logo - Food Icon - Меньше */}
        <div className="mb-2 sm:mb-3">
          <img 
            src="/logo_aero2.svg" 
            alt="Aero Lunch Food Icon" 
            className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto mb-1 sm:mb-2 object-contain"
          />
        </div>

        {/* Airplane Logo - Меньше */}
        <div className="mb-2 sm:mb-3">
          <img 
            src="/logo_aero1.svg" 
            alt="Aero Lunch Airplane" 
            className="w-36 h-18 sm:w-44 sm:h-22 md:w-52 md:h-26 mx-auto mb-0 object-contain"
          />
        </div>

        {/* Title - В два раза больше */}
        <div className="mb-3 sm:mb-4">
          <h1 className="text-6xl sm:text-7xl md:text-8xl font-bold mb-1 sm:mb-2">
            <span className="text-accent-500">Aero</span>
            <span className="text-white"> Lunch</span>
          </h1>
          <p className="text-white text-base sm:text-lg font-medium opacity-90">
            Доставка от 30 минут
          </p>
        </div>
      </div>

      {/* Нижний блок - прижат к низу */}
      <div className="w-full max-w-sm mx-auto text-center pb-5" style={{ paddingBottom: '20px' }}>
        {/* CTA Button */}
        <div className="mb-4">
          <button 
            onClick={onNavigateToMenu}
            className="bg-accent-500 hover:bg-accent-600 text-primary-900 font-semibold text-lg sm:text-xl py-3 sm:py-4 px-8 sm:px-12 rounded-3xl w-full max-w-xs mx-auto transition-all duration-200 shadow-lg hover:shadow-xl"
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