interface LandingPageProps {
  onNavigateToMenu: () => void
}

export default function LandingPage({ onNavigateToMenu }: LandingPageProps) {
  return (
    <div className="fit-screen safe-area-inset flex flex-col justify-between items-center px-4 sm:px-6" style={{ background: 'linear-gradient(to top, #0B73FE, #5BA1FF)' }}>
      {/* Основной контент - центрированный */}
      <div className="flex-1 flex flex-col justify-center items-center text-center">
        {/* Top Logo - Food Icon - logo_aero2 размер 177x47 */}
        <div className="mb-2 sm:mb-3">
          <img 
            src="/logo_aero2.svg" 
            alt="Aero Lunch Food Icon" 
            className="mx-auto object-contain"
            style={{ width: '177px', height: '47px', marginBottom: '100px' }}
          />
        </div>

        {/* Airplane Logo - logo_aero1 размер 86x79 */}
        <div className="mb-2 sm:mb-3">
          <img 
            src="/logo_aero1.svg" 
            alt="Aero Lunch Airplane" 
            className="mx-auto mb-0 object-contain"
            style={{ width: '86px', height: '79px' }}
          />
        </div>

        {/* Title - размер 42, ExtraBold */}
        <div className="mb-3 sm:mb-4">
          <h1 className="font-extrabold mb-0" style={{ fontSize: '42px' }}>
            <span style={{ color: '#FA742D' }}>Aero</span>
            <span className="text-white"> Lunch</span>
          </h1>
          {/* Текст "Быстрая подача прямо на борт самолета" - размер 12, SemiBold, отступ 0 */}
          <p className="text-white font-semibold opacity-90 m-0" style={{ fontSize: '12px' }}>
            Быстрая подача прямо на борт самолета
          </p>
        </div>
      </div>

      {/* Нижний блок - прижат к низу */}
      <div className="w-full max-w-sm mx-auto text-center pb-5" style={{ paddingBottom: '20px' }}>
        {/* CTA Button - цвет #FA742D, размер 324x05, текст белый */}
        <div className="mb-4">
          <button 
            onClick={onNavigateToMenu}
            className="text-white font-semibold rounded-3xl w-full max-w-xs mx-auto transition-all duration-200 shadow-lg hover:shadow-xl"
            style={{ 
              backgroundColor: '#FA742D',
              width: '324px',
              height: '50px',
              fontSize: '16px'
            }}
          >
            Сделать заказ
          </button>
        </div>

        {/* Bottom Text - "Доставка от 30 минут", Regular, размер 16 */}
        <p className="text-white opacity-75 leading-relaxed font-normal" style={{ fontSize: '16px' }}>
          Доставка от 30 минут
        </p>
      </div>
    </div>
  )
} 