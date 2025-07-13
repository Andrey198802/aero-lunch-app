import { useState, useRef, useEffect } from 'react'

interface MenuPageProps {
  onNavigateToLanding: () => void
  onNavigateToCart: () => void
  onNavigateToProfile: () => void
  cart: CartItem[]
  onUpdateCart: (cart: CartItem[]) => void
}

interface CartItem {
  id: number
  title: string
  price: number
  quantity: number
  variant?: string
}

interface MenuItem {
  id: number
  title: string
  description: string
  price: number
  image: string
}

interface ItemDetails {
  description: string
  ingredients: string
  nutrition: {
    proteins: number
    fats: number
    carbs: number
    calories: number
  }
  weight: number
  images: string[]
}

interface DetailedMenuItem extends MenuItem, ItemDetails {}

export default function MenuPage({ onNavigateToLanding, onNavigateToCart, onNavigateToProfile, cart, onUpdateCart }: MenuPageProps) {
  const [selectedCategory, setSelectedCategory] = useState('Завтраки')
  const [showVariantModal, setShowVariantModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<{ id: number; title: string; price: number } | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedDetailItem, setSelectedDetailItem] = useState<DetailedMenuItem | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showCartButton, setShowCartButton] = useState(false)
  const [cartButtonAnimating, setCartButtonAnimating] = useState(false)

  // Управление показом кнопки корзины с анимацией
  useEffect(() => {
    if (getTotalItems() > 0) {
      setShowCartButton(true)
      setCartButtonAnimating(false)
    } else if (showCartButton) {
      // Запускаем анимацию исчезновения
      setCartButtonAnimating(true)
      // Скрываем кнопку после завершения анимации
      setTimeout(() => {
        setShowCartButton(false)
        setCartButtonAnimating(false)
      }, 400) // 400ms - длительность анимации
    }
  }, [cart, showCartButton])
  
  // Функции для работы с корзиной
  const addToCart = (item: { id: number; title: string; price: number }, variant?: string) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id && cartItem.variant === variant)
      if (existingItem) {
      const newCart = cart.map(cartItem =>
          cartItem.id === item.id && cartItem.variant === variant
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        )
      onUpdateCart(newCart)
    } else {
      const newCart = [...cart, { ...item, quantity: 1, variant }]
      onUpdateCart(newCart)
      }
  }
  
  const removeFromCart = (itemId: number, variant?: string) => {
    const existingItem = cart.find(cartItem => cartItem.id === itemId && cartItem.variant === variant)
      if (existingItem && existingItem.quantity > 1) {
      const newCart = cart.map(cartItem =>
          cartItem.id === itemId && cartItem.variant === variant
            ? { ...cartItem, quantity: cartItem.quantity - 1 }
            : cartItem
        )
      onUpdateCart(newCart)
    } else {
      const newCart = cart.filter(cartItem => !(cartItem.id === itemId && cartItem.variant === variant))
      onUpdateCart(newCart)
      }
  }
  
  const getCartItemQuantity = (itemId: number, variant?: string) => {
    const item = cart.find(cartItem => cartItem.id === itemId && cartItem.variant === variant)
    return item ? item.quantity : 0
  }
  
  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  }
  
  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  // Функция для получения вариантов блюда по ID
  const getItemVariants = (itemId: number) => {
    switch (itemId) {
      case 1: // Каша овсяная
        return ['на воде', 'на молоке', 'на альтернативном молоке']
      case 2: // Каша пшённая
        return ['на молоке', 'на альтернативном молоке']
      case 4: // Блинчики с творогом
        return ['со сметаной', 'со сгущенным молоком']
      case 5: // Сырники
        return ['с вареньем из вишни', 'со сметаной', 'со сгущённым молоком']
      case 14: // Блинчики с маслом и ягодами
        return ['с вареньем из вишни', 'со сметаной', 'со сгущённым молоком']
      default:
        return []
    }
  }

  // Проверка, есть ли у товара варианты
  const hasVariants = (itemId: number) => {
    return [1, 2, 4, 5, 14].includes(itemId)
  }



  // Функции для работы с вариантами
  const openVariantModal = (item: { id: number; title: string; price: number }) => {
    setSelectedItem(item)
    setShowVariantModal(true)
  }

  const closeVariantModal = () => {
    setShowVariantModal(false)
    setSelectedItem(null)
  }

  const selectVariant = (variant: string) => {
    if (selectedItem) {
      addToCart(selectedItem, variant)
    }
    closeVariantModal()
  }

  // Функции для работы с детальным модальным окном
  const openDetailModal = (item: MenuItem) => {
    const details = getItemDetails(item.id)
    if (details) {
      setSelectedDetailItem({ ...item, ...details })
      setCurrentImageIndex(0)
      setShowDetailModal(true)
    }
  }

  const closeDetailModal = () => {
    setShowDetailModal(false)
    setSelectedDetailItem(null)
    setCurrentImageIndex(0)
  }


  
  // Функция для уменьшения количества товара с вариантами (выбирает последний добавленный вариант)
  const removeVariantItemFromCart = (itemId: number) => {
    const variantItems = cart.filter(item => item.id === itemId)
    if (variantItems.length > 0) {
      // Берем последний добавленный вариант
      const lastItem = variantItems[variantItems.length - 1]
      removeFromCart(lastItem.id, lastItem.variant)
    }
  }

  // Функция для получения общего количества всех вариантов товара
  const getTotalVariantQuantity = (itemId: number) => {
    const variants = getItemVariants(itemId)
    return variants.reduce((total, variant) => {
      return total + getCartItemQuantity(itemId, variant)
    }, 0)
  }

  // Компонент кнопки цены/количества
  const PriceButton = ({ item }: { item: { id: number; title: string; price: number } }) => {
    // Проверяем, есть ли у товара варианты
    const itemHasVariants = hasVariants(item.id)
    
    if (itemHasVariants) {
      // Для товаров с вариантами показываем общее количество всех вариантов
      const totalQuantity = getTotalVariantQuantity(item.id)
      
      if (totalQuantity === 0) {
        return (
          <div className="price-button">
            <button 
              onClick={() => openVariantModal(item)}
            className="w-full bg-gray-100 hover:bg-gray-200 text-primary-900 font-semibold text-xs py-2 px-3 rounded-full transition-colors h-10 flex items-center justify-center"
            >
              {item.price}₽
            </button>
          </div>
        )
      }
      
      return (
        <div className="price-button">
            <div className="flex items-center bg-white border-2 rounded-full h-10" style={{ borderColor: '#FA742D' }}>
            <button 
              onClick={() => removeVariantItemFromCart(item.id)}
                className="text-primary-900 font-bold text-lg px-3 py-2 flex-none"
            >
              -
            </button>
              <div className="flex-1 text-center text-primary-900 font-semibold text-xs">
              {totalQuantity}
            </div>
            <button 
              onClick={() => openVariantModal(item)}
                className="text-primary-900 font-bold text-lg px-3 py-2 flex-none"
            >
              +
            </button>
          </div>
        </div>
      )
    }
    
    // Обычная логика для других товаров
    const quantity = getCartItemQuantity(item.id)
    
    if (quantity === 0) {
      return (
        <div className="price-button">
          <button 
            onClick={() => addToCart(item)}
            className="w-full bg-gray-100 hover:bg-gray-200 text-primary-900 font-semibold text-xs py-2 px-3 rounded-full transition-colors h-10 flex items-center justify-center"
          >
            {item.price}₽
          </button>
        </div>
      )
    }
    
    return (
      <div className="price-button">
                  <div className="flex items-center bg-white border-2 rounded-full h-10" style={{ borderColor: '#FA742D' }}>
          <button 
            onClick={() => removeFromCart(item.id)}
            className="text-primary-900 font-bold text-lg px-3 py-2 flex-none"
          >
            -
          </button>
          <div className="flex-1 text-center text-primary-900 font-semibold text-xs">
            {quantity}
          </div>
          <button 
            onClick={() => addToCart(item)}
            className="text-primary-900 font-bold text-lg px-3 py-2 flex-none"
          >
            +
          </button>
        </div>
      </div>
    )
  }
  

  
  // Ref для горизонтального меню категорий
  const categoriesMenuRef = useRef<HTMLDivElement>(null)
  // Флаг для отслеживания ручного выбора категории
  const isManualSelection = useRef(false)
  
  const categories = [
    'Любимые',
    'Хиты продаж',
    'Новинки',
    'Завтраки',
    'Сендвичи',
    'Закуски на компанию',
    'Салаты',
    'Супы',
    'Горячее',
    'Гарниры'
  ]

  // Простая функция для скролла к секции
  // Оптимизированная функция для скролла к секции
  const scrollToSection = (category: string) => {
    // Помечаем что это ручной выбор
    isManualSelection.current = true
    setSelectedCategory(category)
    
    // Скроллим кнопку в центр горизонтального меню
    if (categoriesMenuRef.current) {
      const activeButton = categoriesMenuRef.current.querySelector(`[data-category="${category}"]`) as HTMLButtonElement
      if (activeButton) {
        activeButton.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        })
      }
    }
    
    // Скроллим к секции
    const element = document.getElementById(category)
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      })
    }
    
    // Сбрасываем флаг через время
    setTimeout(() => {
      isManualSelection.current = false
    }, 1000)
  }

  // Дебаунс для IntersectionObserver
  const intersectionTimeoutRef = useRef<number>(0)
  const isScrollingRef = useRef(false)

  // Используем IntersectionObserver для отслеживания видимых секций
  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '-50% 0px -40% 0px', // Переключаем когда секция в центре экрана
      threshold: 0.1
    }

    const observer = new IntersectionObserver((entries) => {
      if (isManualSelection.current || isScrollingRef.current) return // Не обновляем если идет ручной скролл или активный скролл
      
      // Дебаунс для предотвращения частых обновлений
      if (intersectionTimeoutRef.current) {
        clearTimeout(intersectionTimeoutRef.current)
      }
      
      intersectionTimeoutRef.current = setTimeout(() => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !isScrollingRef.current) {
            setSelectedCategory(entry.target.id)
          }
        })
      }, 150) // Небольшая задержка
    }, options)

    // Наблюдаем только за секциями с контентом
    const sections = [
      'Завтраки', 'Сендвичи', 'Закуски на компанию', 
      'Салаты', 'Супы', 'Горячее', 'Гарниры'
    ]
    
    sections.forEach(sectionName => {
      const element = document.getElementById(sectionName)
      if (element) {
        observer.observe(element)
      }
    })

    return () => {
      observer.disconnect()
      if (intersectionTimeoutRef.current) {
        clearTimeout(intersectionTimeoutRef.current)
      }
    }
  }, [])

  // Отслеживание скрола для предотвращения конфликтов
  useEffect(() => {
    let scrollTimer: number
    
    const handleScroll = () => {
      isScrollingRef.current = true
      clearTimeout(scrollTimer)
      
      scrollTimer = setTimeout(() => {
        isScrollingRef.current = false
      }, 100)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      clearTimeout(scrollTimer)
    }
  }, [])

  // Автоматический скролл горизонтального меню к активной кнопке
  useEffect(() => {
      if (categoriesMenuRef.current) {
        const activeButton = categoriesMenuRef.current.querySelector(`[data-category="${selectedCategory}"]`) as HTMLButtonElement
        if (activeButton) {
        const container = categoriesMenuRef.current
        const buttonRect = activeButton.getBoundingClientRect()
        const containerRect = container.getBoundingClientRect()
        
        // Вычисляем позицию для центрирования кнопки
        const buttonCenter = buttonRect.left + buttonRect.width / 2
        const containerCenter = containerRect.left + containerRect.width / 2
        const scrollOffset = buttonCenter - containerCenter
        
        // Плавный скролл без блокировки основного скролла
        const currentScroll = container.scrollLeft
        const targetScroll = currentScroll + scrollOffset
        
        // Анимация скролла через requestAnimationFrame
        const startTime = performance.now()
        const duration = isManualSelection.current ? 300 : 150 // Быстрее для автоматического
        
        const animateScroll = (currentTime: number) => {
          const elapsed = currentTime - startTime
          const progress = Math.min(elapsed / duration, 1)
          
          // Easing функция для плавности
          const easeProgress = progress * (2 - progress)
          
          container.scrollLeft = currentScroll + (targetScroll - currentScroll) * easeProgress
          
          if (progress < 1) {
            requestAnimationFrame(animateScroll)
          }
        }
        
        requestAnimationFrame(animateScroll)
      }
    }
  }, [selectedCategory])

  const breakfastItems = [
    {
      id: 1,
      title: 'Каша овсяная со свежими ягодами',
      description: 'на воде, молоке или альтернативном молоке',
      price: 900,
      image: '/logo_aero3.svg'
    },
    {
      id: 2,
      title: 'Каша пшённая с чатни из тыквы',
      description: 'на молоке или альтернативном молоке',
      price: 900,
      image: '/logo_aero3.svg'
    },
    {
      id: 3,
      title: 'Блинчики с мясом и микс-салатом',
      description: '',
      price: 1300,
      image: '/logo_aero3.svg'
    },
    {
      id: 4,
      title: 'Блинчики с творогом',
      description: 'со сметаной или сгущенным молоком',
      price: 1300,
      image: '/logo_aero3.svg'
    },
    {
      id: 5,
      title: 'Сырники со свежими ягодами',
      description: 'с вареньем из вишни, сметаной или сгущённым молоком',
      price: 1300,
      image: '/logo_aero3.svg'
    },
    {
      id: 6,
      title: 'Яйцо пашот с микс-салатом',
      description: '',
      price: 700,
      image: '/logo_aero3.svg'
    },
    {
      id: 7,
      title: 'Яичница глазунья с микс-салатом',
      description: '',
      price: 700,
      image: '/logo_aero3.svg'
    },
    {
      id: 8,
      title: 'Омлет классический с микс-салатом',
      description: '',
      price: 700,
      image: '/logo_aero3.svg'
    },
    {
      id: 9,
      title: 'Скрэмбл с микс-салатом',
      description: '',
      price: 700,
      image: '/logo_aero3.svg'
    },
    {
      id: 10,
      title: 'Картофельные драники с лососем',
      description: '',
      price: 1500,
      image: '/logo_aero3.svg'
    },
    {
      id: 11,
      title: 'Слабосоленый лосось с жаренным авокадо и яйцом пашот',
      description: '',
      price: 1500,
      image: '/logo_aero3.svg'
    },
    {
      id: 12,
      title: 'Оладьи из кабачков с тигровыми креветками',
      description: 'и соусом ткемали',
      price: 1300,
      image: '/logo_aero3.svg'
    },
    {
      id: 13,
      title: 'Домашний йогурт со свежими ягодами',
      description: '',
      price: 800,
      image: '/logo_aero3.svg'
    },
    {
      id: 14,
      title: 'Блинчики с маслом и ягодами',
      description: 'с вареньем из вишни, сметаной или сгущённым молоком',
      price: 900,
      image: '/logo_aero3.svg'
    }
  ]

  const sandwichItems = [
    {
      id: 15,
      title: 'Сэндвич с лососем и соусом из артишоков',
      description: '',
      price: 1600,
      image: '/logo_aero3.svg'
    },
    {
      id: 16,
      title: 'Сэндвич с куриным филе и соусом свит чили',
      description: '',
      price: 1300,
      image: '/logo_aero3.svg'
    },
    {
      id: 17,
      title: 'Сэндвич с ростбифом, глазуньей и горчичным соусом',
      description: '',
      price: 1800,
      image: '/logo_aero3.svg'
    },
    {
      id: 18,
      title: 'Сэндвич с ветчиной и сыром',
      description: '',
      price: 1300,
      image: '/logo_aero3.svg'
    },
    {
      id: 19,
      title: 'Чиабатта с бужениной и пикантным соусом',
      description: '',
      price: 1800,
      image: '/logo_aero3.svg'
    },
    {
      id: 20,
      title: 'Чиабатта с пастрами из индейки, жареными кабачками и соусом сацебели',
      description: '',
      price: 1300,
      image: '/logo_aero3.svg'
    },
    {
      id: 21,
      title: 'Круассан с лососем, свежим огурцом и сливочным сыром',
      description: '',
      price: 1800,
      image: '/logo_aero3.svg'
    },
    {
      id: 22,
      title: 'Круассан с ветчиной и сыром',
      description: '',
      price: 1300,
      image: '/logo_aero3.svg'
    },
    {
      id: 23,
      title: 'Круассан с сыром',
      description: '',
      price: 1300,
      image: '/logo_aero3.svg'
    }
  ]

  const snacksItems = [
    {
      id: 24,
      title: 'Мясное ассорти с микс-салатом',
      description: '',
      price: 4800,
      image: '/logo_aero3.svg'
    },
    {
      id: 25,
      title: 'Рыбное ассорти',
      description: '',
      price: 8000,
      image: '/logo_aero3.svg'
    },
    {
      id: 26,
      title: 'Сало с солёными огурцами и зелёным луком',
      description: '',
      price: 1200,
      image: '/logo_aero3.svg'
    },
    {
      id: 27,
      title: 'Ассорти из свежих овощей',
      description: '',
      price: 1600,
      image: '/logo_aero3.svg'
    },
    {
      id: 28,
      title: 'Сырное ассорти со свежими ягодами, грецкими орехами и мёдом',
      description: '',
      price: 5400,
      image: '/logo_aero3.svg'
    },
    {
      id: 29,
      title: 'Соленья бочковые',
      description: '',
      price: 1200,
      image: '/logo_aero3.svg'
    },
    {
      id: 30,
      title: 'Сельдь атлантическая с чесночными гренками и мини картофелем',
      description: '',
      price: 1200,
      image: '/logo_aero3.svg'
    }
  ]

  const saladsItems = [
    {
      id: 31,
      title: 'Легкий салат с сыром фета',
      description: '',
      price: 1300,
      image: '/logo_aero3.svg'
    },
    {
      id: 32,
      title: 'Салат Цезарь с цыплёнком',
      description: '',
      price: 1300,
      image: '/logo_aero3.svg'
    },
    {
      id: 33,
      title: 'Салат Цезарь с креветками',
      description: '',
      price: 1700,
      image: '/logo_aero3.svg'
    },
    {
      id: 34,
      title: 'Салат Цезарь с лососем',
      description: '',
      price: 2200,
      image: '/logo_aero3.svg'
    },
    {
      id: 35,
      title: 'Салат Оливье с цыплёнком',
      description: '',
      price: 1300,
      image: '/logo_aero3.svg'
    },
    {
      id: 36,
      title: 'Салат Оливье с ростбифом',
      description: '',
      price: 1700,
      image: '/logo_aero3.svg'
    },
    {
      id: 37,
      title: 'Салат Оливье с лососем',
      description: '',
      price: 2200,
      image: '/logo_aero3.svg'
    },
    {
      id: 38,
      title: 'Салат с жаренным авокадо, креветками Том Ям и манговым соусом',
      description: '',
      price: 2600,
      image: '/logo_aero3.svg'
    },
    {
      id: 39,
      title: 'Салат с ростбифом, корнишонами и сметанной заправкой',
      description: '',
      price: 2300,
      image: '/logo_aero3.svg'
    },
    {
      id: 40,
      title: 'Салат с печеной свеклой и битыми огурцами',
      description: '',
      price: 900,
      image: '/logo_aero3.svg'
    },
    {
      id: 41,
      title: 'Тёплый салат из баклажан с соусом свит чили',
      description: '',
      price: 1400,
      image: '/logo_aero3.svg'
    },
    {
      id: 42,
      title: 'Салат из спелых томатов, сыром фета и красным луком',
      description: '',
      price: 1200,
      image: '/logo_aero3.svg'
    }
  ]

  const soupsItems = [
    {
      id: 43,
      title: 'Суп карри с тигровыми креветками на кокосовом молоке',
      description: '',
      price: 1950,
      image: '/logo_aero3.svg'
    },
    {
      id: 44,
      title: 'Солянка мясная',
      description: '',
      price: 1300,
      image: '/logo_aero3.svg'
    },
    {
      id: 45,
      title: 'Борщ с салом и ржаными гренками',
      description: '',
      price: 1300,
      image: '/logo_aero3.svg'
    },
    {
      id: 46,
      title: 'Уха из судака и лосося с пирожком',
      description: '',
      price: 1900,
      image: '/logo_aero3.svg'
    },
    {
      id: 47,
      title: 'Крем суп из белых грибов с пшеничными гренками',
      description: '',
      price: 1300,
      image: '/logo_aero3.svg'
    },
    {
      id: 48,
      title: 'Крем суп из тыквы с тигровыми креветками',
      description: '',
      price: 1900,
      image: '/logo_aero3.svg'
    },
    {
      id: 49,
      title: 'Суп куриный с домашней лапшой',
      description: '',
      price: 1100,
      image: '/logo_aero3.svg'
    }
  ]

  const hotItems = [
    {
      id: 50,
      title: 'Паста Карбонара',
      description: '',
      price: 1800,
      image: '/logo_aero3.svg'
    },
    {
      id: 51,
      title: 'Филе судака с брокколи и соусом из шпината',
      description: '',
      price: 2900,
      image: '/logo_aero3.svg'
    },
    {
      id: 52,
      title: 'Стейк из лосося с йогуртовым соусом и микс салатом',
      description: '',
      price: 3600,
      image: '/logo_aero3.svg'
    },
    {
      id: 53,
      title: 'Медальоны из мраморной говядины с жареными кабачками и перечным соусом',
      description: '',
      price: 4500,
      image: '/logo_aero3.svg'
    },
    {
      id: 54,
      title: 'Бефстроганов из мраморной говядины с белыми грибами и картофельным пюре',
      description: '',
      price: 2900,
      image: '/logo_aero3.svg'
    },
    {
      id: 55,
      title: 'Биточки куриные с картофельным пюре и соусом из белых грибов',
      description: '',
      price: 2200,
      image: '/logo_aero3.svg'
    },
    {
      id: 56,
      title: 'Пельмени с бульоном, сметаной и зеленью',
      description: '',
      price: 1400,
      image: '/logo_aero3.svg'
    }
  ]

  const sidesItems = [
    {
      id: 57,
      title: 'Картофельное пюре',
      description: '',
      price: 600,
      image: '/logo_aero3.svg'
    },
    {
      id: 58,
      title: 'Гречневая каша с грибами и луком',
      description: '',
      price: 1200,
      image: '/logo_aero3.svg'
    },
    {
      id: 59,
      title: 'Картофель фри/по-деревенски',
      description: '',
      price: 600,
      image: '/logo_aero3.svg'
    },
    {
      id: 60,
      title: 'Жаренный картофель с грибами и луком',
      description: '',
      price: 1200,
      image: '/logo_aero3.svg'
    },
    {
      id: 61,
      title: 'Рис Басмати',
      description: '',
      price: 600,
      image: '/logo_aero3.svg'
    },
    {
      id: 62,
      title: 'Овощи гриль',
      description: '',
      price: 1200,
      image: '/logo_aero3.svg'
    }
  ]

  // Получение детальной информации о блюде (перенесено после определения массивов)
  const getItemDetails = (itemId: number): ItemDetails | null => {
    // Находим блюдо во всех массивах
    const allItems = [...breakfastItems, ...sandwichItems, ...snacksItems, ...saladsItems, ...soupsItems, ...hotItems, ...sidesItems]
    const item = allItems.find(i => i.id === itemId)
    
    if (!item) return null

    // Базовая информация для всех блюд
    const baseDetails = {
      description: item.description || 'Вкусное блюдо от наших поваров, приготовленное из свежих ингредиентов.',
      ingredients: 'Состав уточняется...',
      nutrition: {
        proteins: 15,
        fats: 10,
        carbs: 25,
        calories: 250
      },
      weight: 200,
      images: [item.image, item.image] // Используем изображение блюда
    }

    // Специфичная информация для некоторых блюд
    switch (itemId) {
      case 1: // Каша овсяная
        return {
          ...baseDetails,
          description: 'Полезная овсяная каша со свежими ягодами. Отличный выбор для здорового завтрака.',
          ingredients: 'Овсяные хлопья, молоко/вода, свежие ягоды, мёд',
          nutrition: { proteins: 8, fats: 5, carbs: 45, calories: 250 },
          weight: 300
        }
      case 2: // Каша пшённая
        return {
          ...baseDetails,
          description: 'Нежная пшённая каша с ароматным чатни из тыквы.',
          ingredients: 'Пшено, молоко, тыква, специи, мёд',
          nutrition: { proteins: 7, fats: 6, carbs: 40, calories: 240 },
          weight: 280
        }
      case 3: // Блинчики с мясом
        return {
          ...baseDetails,
          description: 'Нежные тонкие блинчики с сочной мясной начинкой и свежим микс-салатом. Идеальное сочетание вкуса и сытности.',
          ingredients: 'Мука пшеничная, молоко, яйца, мясной фарш (говядина, свинина), лук, морковь, салат айсберг, руккола, томаты черри, огурцы',
          nutrition: { proteins: 18, fats: 12, carbs: 35, calories: 290 },
          weight: 250
        }
      case 4: // Блинчики с творогом
        return {
          ...baseDetails,
          description: 'Воздушные блинчики с нежным творогом и вашим любимым топпингом.',
          ingredients: 'Мука, молоко, яйца, творог, сметана/сгущённое молоко',
          nutrition: { proteins: 16, fats: 8, carbs: 30, calories: 260 },
          weight: 220
        }
      case 1: // Каша овсяная с ягодами
        return {
          ...baseDetails,
          description: 'Нежная овсяная каша на молоке с натуральными ягодами и медом.',
          ingredients: 'Овсяные хлопья, молоко, свежие ягоды (клубника, черника, малина), мед, сливочное масло',
          nutrition: { proteins: 8, fats: 6, carbs: 32, calories: 200 },
          weight: 250
        }
      case 2: // Каша рисовая с изюмом
        return {
          ...baseDetails,
          description: 'Сладкая рисовая каша на молоке с изюмом и корицей.',
          ingredients: 'Рис, молоко, изюм, сахар, корица, сливочное масло, ваниль',
          nutrition: { proteins: 6, fats: 4, carbs: 35, calories: 190 },
          weight: 250
        }
      case 3: // Каша гречневая с молоком
        return {
          ...baseDetails,
          description: 'Питательная гречневая каша на молоке с добавлением сливочного масла.',
          ingredients: 'Гречка, молоко, сливочное масло, соль, сахар',
          nutrition: { proteins: 10, fats: 8, carbs: 28, calories: 210 },
          weight: 250
        }
      case 4: // Мюсли с йогуртом
        return {
          ...baseDetails,
          description: 'Хрустящие мюсли с натуральным йогуртом, орехами и свежими фруктами.',
          ingredients: 'Мюсли (овсяные хлопья, орехи, сухофрукты), йогурт натуральный, свежие фрукты, мед',
          nutrition: { proteins: 12, fats: 10, carbs: 30, calories: 240 },
          weight: 200
        }
      case 5: // Сырники
        return {
          ...baseDetails,
          description: 'Классические сырники со свежими ягодами и вашим любимым соусом.',
          ingredients: 'Творог, мука, яйца, сахар, свежие ягоды, варенье/сметана/сгущённое молоко',
          nutrition: { proteins: 20, fats: 12, carbs: 25, calories: 280 },
          weight: 180
        }
      case 6: // Яйцо пашот с микс-салатом
        return {
          ...baseDetails,
          description: 'Нежное яйцо пашот с жидким желтком, подается со свежим микс-салатом.',
          ingredients: 'Яйца куриные, салат айсберг, руккола, томаты черри, огурцы, оливковое масло',
          nutrition: { proteins: 12, fats: 8, carbs: 5, calories: 130 },
          weight: 150
        }
      case 7: // Яичница глазунья с микс-салатом
        return {
          ...baseDetails,
          description: 'Классическая яичница глазунья с хрустящими краями и свежим микс-салатом.',
          ingredients: 'Яйца куриные, сливочное масло, салат айсберг, руккола, томаты черри, огурцы',
          nutrition: { proteins: 14, fats: 12, carbs: 4, calories: 170 },
          weight: 160
        }
      case 8: // Омлет классический с микс-салатом
        return {
          ...baseDetails,
          description: 'Воздушный омлет, приготовленный на сливочном масле, с нежным микс-салатом.',
          ingredients: 'Яйца куриные, молоко, сливочное масло, салат айсберг, руккола, томаты черри',
          nutrition: { proteins: 16, fats: 14, carbs: 3, calories: 190 },
          weight: 180
        }
      case 9: // Скрэмбл с микс-салатом
        return {
          ...baseDetails,
          description: 'Нежный скрэмбл из взбитых яиц, медленно приготовленный до кремовой текстуры.',
          ingredients: 'Яйца куриные, сливки, сливочное масло, салат айсберг, руккола, зелень',
          nutrition: { proteins: 15, fats: 16, carbs: 2, calories: 200 },
          weight: 170
        }
      case 10: // Картофельные драники с лососем
        return {
          ...baseDetails,
          description: 'Хрустящие картофельные драники с нежным слабосоленым лососем и сметаной.',
          ingredients: 'Картофель, яйца, мука, лук, лосось слабосоленый, сметана, укроп',
          nutrition: { proteins: 22, fats: 18, carbs: 25, calories: 340 },
          weight: 220
        }
      case 11: // Слабосоленый лосось с жареным авокадо и яйцом пашот
        return {
          ...baseDetails,
          description: 'Изысканное сочетание слабосоленого лосося, жареного авокадо и нежного яйца пашот.',
          ingredients: 'Лосось слабосоленый, авокадо, яйца куриные, лимон, оливковое масло, микрозелень',
          nutrition: { proteins: 28, fats: 24, carbs: 8, calories: 360 },
          weight: 200
        }
      case 12: // Оладьи из кабачков с тигровыми креветками
        return {
          ...baseDetails,
          description: 'Легкие оладьи из свежих кабачков с сочными тигровыми креветками и соусом ткемали.',
          ingredients: 'Кабачки, мука, яйца, креветки тигровые, соус ткемали, зелень, специи',
          nutrition: { proteins: 20, fats: 10, carbs: 18, calories: 230 },
          weight: 190
        }
      case 13: // Домашний йогурт со свежими ягодами
        return {
          ...baseDetails,
          description: 'Нежный домашний йогурт с натуральными свежими ягодами и медом.',
          ingredients: 'Йогурт натуральный, свежие ягоды (клубника, черника, малина), мед, мята',
          nutrition: { proteins: 8, fats: 4, carbs: 15, calories: 120 },
          weight: 150
        }
      case 14: // Блинчики с маслом и ягодами
        return {
          ...baseDetails,
          description: 'Тонкие блинчики со сливочным маслом, свежими ягодами и вашим любимым топпингом.',
          ingredients: 'Мука, молоко, яйца, сливочное масло, свежие ягоды, варенье/сметана/сгущённое молоко',
          nutrition: { proteins: 12, fats: 8, carbs: 35, calories: 250 },
          weight: 200
        }
      // Сэндвичи
      case 15: // Сэндвич с лососем и соусом из артишоков
        return {
          ...baseDetails,
          description: 'Изысканный сэндвич с нежным лососем, авторским соусом из артишоков и свежими овощами.',
          ingredients: 'Хлеб цельнозерновой, лосось слабосоленый, соус из артишоков, салат, томаты, огурцы',
          nutrition: { proteins: 25, fats: 18, carbs: 28, calories: 360 },
          weight: 220
        }
      case 16: // Сэндвич с куриным филе и соусом свит чили
        return {
          ...baseDetails,
          description: 'Сочный сэндвич с нежным куриным филе, пикантным соусом свит чили и хрустящими овощами.',
          ingredients: 'Хлеб, куриное филе, соус свит чили, салат айсберг, томаты, огурцы, лук красный',
          nutrition: { proteins: 28, fats: 12, carbs: 32, calories: 320 },
          weight: 250
        }
      case 17: // Сэндвич с ростбифом, глазуньей и горчичным соусом
        return {
          ...baseDetails,
          description: 'Сытный сэндвич с сочным ростбифом, яичницей глазунья и ароматным горчичным соусом.',
          ingredients: 'Хлеб, ростбиф, яйца, горчичный соус, салат, томаты, лук карамелизированный',
          nutrition: { proteins: 32, fats: 20, carbs: 25, calories: 380 },
          weight: 280
        }
      case 18: // Сэндвич с ветчиной и сыром
        return {
          ...baseDetails,
          description: 'Классический сэндвич с ароматной ветчиной, сыром и свежими овощами.',
          ingredients: 'Хлеб, ветчина, сыр, салат, томаты, огурцы, майонез',
          nutrition: { proteins: 22, fats: 15, carbs: 28, calories: 310 },
          weight: 200
        }
      case 19: // Чиабатта с бужениной и пикантным соусом
        return {
          ...baseDetails,
          description: 'Ароматная чиабатта с нежной бужениной, пикантным соусом и свежими травами.',
          ingredients: 'Чиабатта, буженина, пикантный соус, руккола, томаты, лук красный',
          nutrition: { proteins: 26, fats: 18, carbs: 30, calories: 360 },
          weight: 240
        }
      case 20: // Чиабатта с пастрами из индейки
        return {
          ...baseDetails,
          description: 'Сочная чиабатта с пастрами из индейки, жареными кабачками и грузинским соусом сацебели.',
          ingredients: 'Чиабатта, пастрами из индейки, кабачки жареные, соус сацебели, зелень',
          nutrition: { proteins: 24, fats: 14, carbs: 26, calories: 300 },
          weight: 230
        }
      case 21: // Круассан с лососем, огурцом и сливочным сыром
        return {
          ...baseDetails,
          description: 'Воздушный круассан с нежным лососем, свежим огурцом и кремовым сливочным сыром.',
          ingredients: 'Круассан, лосось слабосоленый, огурец, сливочный сыр, укроп, каперсы',
          nutrition: { proteins: 20, fats: 22, carbs: 20, calories: 340 },
          weight: 180
        }
      case 22: // Круассан с ветчиной и сыром
        return {
          ...baseDetails,
          description: 'Классический круассан с ароматной ветчиной и расплавленным сыром.',
          ingredients: 'Круассан, ветчина, сыр, салат, томаты',
          nutrition: { proteins: 18, fats: 20, carbs: 22, calories: 320 },
          weight: 160
        }
      case 23: // Круассан с сыром
        return {
          ...baseDetails,
          description: 'Нежный круассан с расплавленным сыром и свежими травами.',
          ingredients: 'Круассан, сыр, зелень, специи',
          nutrition: { proteins: 12, fats: 18, carbs: 25, calories: 290 },
          weight: 140
        }
      case 31: // Легкий салат с сыром фета
        return {
          ...baseDetails,
          description: 'Освежающий салат с нежным сыром фета, свежими овощами и ароматными травами.',
          ingredients: 'Салат айсберг, томаты черри, огурцы, сыр фета, красный лук, оливковое масло, лимонный сок, орегано',
          nutrition: { proteins: 12, fats: 15, carbs: 8, calories: 210 },
          weight: 200
        }
      case 32: // Салат Цезарь с цыплёнком
        return {
          ...baseDetails,
          description: 'Классический салат Цезарь с нежным цыплёнком, хрустящими листьями салата, пармезаном и фирменным соусом.',
          ingredients: 'Куриное филе, салат романо, сыр пармезан, соус цезарь, гренки, чеснок, анчоусы',
          nutrition: { proteins: 25, fats: 18, carbs: 12, calories: 290 },
          weight: 250
        }
      case 33: // Салат Цезарь с креветками
        return {
          ...baseDetails,
          description: 'Изысканный салат Цезарь с сочными креветками, хрустящими листьями салата и классическим соусом.',
          ingredients: 'Креветки тигровые, салат романо, сыр пармезан, соус цезарь, гренки, чеснок, анчоусы',
          nutrition: { proteins: 22, fats: 16, carbs: 10, calories: 260 },
          weight: 230
        }
      case 34: // Салат Цезарь с лососем
        return {
          ...baseDetails,
          description: 'Премиальный салат Цезарь с нежным лососем, свежими листьями салата и авторским соусом.',
          ingredients: 'Лосось слабосоленый, салат романо, сыр пармезан, соус цезарь, гренки, чеснок, каперсы',
          nutrition: { proteins: 28, fats: 22, carbs: 8, calories: 340 },
          weight: 240
        }
      case 35: // Салат Оливье с цыплёнком
        return {
          ...baseDetails,
          description: 'Традиционный салат Оливье с нежным цыплёнком, свежими овощами и майонезной заправкой.',
          ingredients: 'Куриное филе, картофель, морковь, яйца, огурцы маринованные, зелёный горошек, майонез',
          nutrition: { proteins: 18, fats: 20, carbs: 15, calories: 310 },
          weight: 280
        }
      case 36: // Салат Оливье с ростбифом
        return {
          ...baseDetails,
          description: 'Изысканный салат Оливье с сочным ростбифом, классическими овощами и деликатной заправкой.',
          ingredients: 'Ростбиф, картофель, морковь, яйца, огурцы маринованные, зелёный горошек, майонез',
          nutrition: { proteins: 22, fats: 18, carbs: 14, calories: 290 },
          weight: 270
        }
      case 37: // Салат Оливье с лососем
        return {
          ...baseDetails,
          description: 'Премиальный салат Оливье с нежным лососем, свежими овощами и авторской заправкой.',
          ingredients: 'Лосось слабосоленый, картофель, морковь, яйца, огурцы маринованные, зелёный горошек, майонез',
          nutrition: { proteins: 20, fats: 24, carbs: 12, calories: 340 },
          weight: 260
        }
      case 38: // Салат с жаренным авокадо, креветками и манговым соусом
        return {
          ...baseDetails,
          description: 'Экзотический салат с жареным авокадо, сочными креветками Том Ям и ароматным манговым соусом.',
          ingredients: 'Креветки тигровые, авокадо, манго, салат айсберг, руккола, соус манговый, лайм, кинза',
          nutrition: { proteins: 24, fats: 18, carbs: 16, calories: 320 },
          weight: 220
        }
      case 39: // Салат с ростбифом, корнишонами и сметанной заправкой
        return {
          ...baseDetails,
          description: 'Сытный салат с сочным ростбифом, хрустящими корнишонами и нежной сметанной заправкой.',
          ingredients: 'Ростбиф, корнишоны, салат айсберг, томаты, красный лук, сметана, горчица, зелень',
          nutrition: { proteins: 26, fats: 16, carbs: 8, calories: 280 },
          weight: 240
        }
      case 40: // Салат с печеной свеклой и битыми огурцами
        return {
          ...baseDetails,
          description: 'Полезный салат с ароматной печеной свеклой, свежими огурцами и легкой заправкой.',
          ingredients: 'Свекла печеная, огурцы свежие, грецкие орехи, сыр фета, оливковое масло, бальзамик',
          nutrition: { proteins: 8, fats: 12, carbs: 18, calories: 200 },
          weight: 180
        }
      case 41: // Тёплый салат из баклажан с соусом свит чили
        return {
          ...baseDetails,
          description: 'Ароматный теплый салат из запеченных баклажанов с пикантным соусом свит чили.',
          ingredients: 'Баклажаны, болгарский перец, лук красный, соус свит чили, кунжут, зелень',
          nutrition: { proteins: 4, fats: 8, carbs: 22, calories: 160 },
          weight: 200
        }
      case 42: // Салат из спелых томатов, сыром фета и красным луком
        return {
          ...baseDetails,
          description: 'Летний салат из сочных спелых томатов с нежным сыром фета и ароматным красным луком.',
          ingredients: 'Томаты спелые, сыр фета, лук красный, базилик, оливковое масло, бальзамический уксус',
          nutrition: { proteins: 10, fats: 14, carbs: 12, calories: 210 },
          weight: 190
        }
      // Закуски
      case 24: // Мясное ассорти с микс-салатом
        return {
          ...baseDetails,
          description: 'Изысканное мясное ассорти из отборных деликатесов с свежим микс-салатом.',
          ingredients: 'Ветчина, салями, буженина, пастрами, салат айсберг, руккола, томаты черри, огурцы',
          nutrition: { proteins: 35, fats: 25, carbs: 8, calories: 380 },
          weight: 300
        }
      case 25: // Рыбное ассорти
        return {
          ...baseDetails,
          description: 'Премиальное рыбное ассорти из свежих морепродуктов и деликатесной рыбы.',
          ingredients: 'Лосось слабосоленый, семга, форель, икра, креветки, лимон, каперсы',
          nutrition: { proteins: 40, fats: 30, carbs: 5, calories: 420 },
          weight: 250
        }
      case 26: // Сало с солёными огурцами и зелёным луком
        return {
          ...baseDetails,
          description: 'Традиционное сало с хрустящими солёными огурцами и свежим зелёным луком.',
          ingredients: 'Сало свиное, огурцы солёные, лук зелёный, чеснок, укроп',
          nutrition: { proteins: 8, fats: 45, carbs: 3, calories: 450 },
          weight: 150
        }
      case 27: // Ассорти из свежих овощей
        return {
          ...baseDetails,
          description: 'Красочное ассорти из свежих сезонных овощей с травяной заправкой.',
          ingredients: 'Томаты, огурцы, болгарский перец, морковь, редис, зелень, оливковое масло',
          nutrition: { proteins: 3, fats: 8, carbs: 12, calories: 120 },
          weight: 200
        }
      case 28: // Сырное ассорти со свежими ягодами
        return {
          ...baseDetails,
          description: 'Изысканное сырное ассорти с свежими ягодами, грецкими орехами и медом.',
          ingredients: 'Сыр бри, камамбер, чеддер, пармезан, свежие ягоды, грецкие орехи, мед',
          nutrition: { proteins: 25, fats: 35, carbs: 15, calories: 450 },
          weight: 180
        }
      case 29: // Соленья бочковые
        return {
          ...baseDetails,
          description: 'Традиционные бочковые соленья с насыщенным вкусом и хрустящей текстурой.',
          ingredients: 'Огурцы бочковые, томаты, капуста квашеная, морковь по-корейски',
          nutrition: { proteins: 2, fats: 1, carbs: 8, calories: 45 },
          weight: 150
        }
      case 30: // Сельдь атлантическая с чесночными гренками
        return {
          ...baseDetails,
          description: 'Нежная атлантическая сельдь с ароматными чесночными гренками и мини картофелем.',
          ingredients: 'Сельдь атлантическая, картофель мини, хлеб, чеснок, сливочное масло, зелень',
          nutrition: { proteins: 20, fats: 15, carbs: 18, calories: 280 },
          weight: 200
        }
      // Супы
      case 43: // Суп карри с тигровыми креветками
        return {
          ...baseDetails,
          description: 'Ароматный суп карри на кокосовом молоке с сочными тигровыми креветками.',
          ingredients: 'Креветки тигровые, кокосовое молоко, карри, лемонграсс, имбирь, лайм, кинза',
          nutrition: { proteins: 25, fats: 18, carbs: 12, calories: 290 },
          weight: 350
        }
      case 44: // Солянка мясная
        return {
          ...baseDetails,
          description: 'Традиционная мясная солянка с копченостями, оливками и лимоном.',
          ingredients: 'Говядина, ветчина, сосиски, оливки, каперсы, лимон, сметана, зелень',
          nutrition: { proteins: 18, fats: 12, carbs: 8, calories: 200 },
          weight: 350
        }
      case 45: // Борщ с салом и ржаными гренками
        return {
          ...baseDetails,
          description: 'Классический украинский борщ с салом и ароматными ржаными гренками.',
          ingredients: 'Свекла, капуста, морковь, лук, говядина, сало, ржаной хлеб, сметана',
          nutrition: { proteins: 15, fats: 10, carbs: 15, calories: 200 },
          weight: 350
        }
      case 46: // Уха из судака и лосося с пирожком
        return {
          ...baseDetails,
          description: 'Прозрачная уха из благородной рыбы с ароматными травами и пирожком.',
          ingredients: 'Судак, лосось, лук, морковь, картофель, лавровый лист, укроп, пирожок',
          nutrition: { proteins: 22, fats: 8, carbs: 20, calories: 230 },
          weight: 350
        }
      case 47: // Крем суп из белых грибов
        return {
          ...baseDetails,
          description: 'Нежный крем-суп из белых грибов с пшеничными гренками и сливками.',
          ingredients: 'Белые грибы, сливки, лук, картофель, пшеничные гренки, зелень',
          nutrition: { proteins: 8, fats: 15, carbs: 12, calories: 200 },
          weight: 300
        }
      case 48: // Крем суп из тыквы с креветками
        return {
          ...baseDetails,
          description: 'Бархатистый крем-суп из тыквы с сочными тигровыми креветками.',
          ingredients: 'Тыква, креветки тигровые, сливки, лук, имбирь, кокосовое молоко, тыквенные семечки',
          nutrition: { proteins: 12, fats: 10, carbs: 18, calories: 190 },
          weight: 300
        }
      case 49: // Суп куриный с домашней лапшой
        return {
          ...baseDetails,
          description: 'Домашний куриный суп с нежной лапшой и ароматными овощами.',
          ingredients: 'Курица, домашняя лапша, морковь, лук, картофель, зелень, яйца',
          nutrition: { proteins: 15, fats: 6, carbs: 20, calories: 180 },
          weight: 350
        }
      // Горячие блюда
      case 50: // Паста Карбонара
        return {
          ...baseDetails,
          description: 'Классическая итальянская паста Карбонара с беконом, яйцом и пармезаном.',
          ingredients: 'Спагетти, бекон, яйца, сыр пармезан, сливки, чеснок, черный перец',
          nutrition: { proteins: 20, fats: 25, carbs: 45, calories: 450 },
          weight: 300
        }
      case 51: // Филе судака с брокколи
        return {
          ...baseDetails,
          description: 'Нежное филе судака с брокколи и ароматным соусом из шпината.',
          ingredients: 'Судак, брокколи, шпинат, сливки, лимон, оливковое масло, чеснок',
          nutrition: { proteins: 28, fats: 12, carbs: 8, calories: 240 },
          weight: 250
        }
      case 52: // Стейк из лосося с йогуртовым соусом
        return {
          ...baseDetails,
          description: 'Сочный стейк из лосося с йогуртовым соусом и свежим микс-салатом.',
          ingredients: 'Лосось, йогурт натуральный, огурцы, укроп, лимон, салат айсберг, руккола',
          nutrition: { proteins: 32, fats: 20, carbs: 5, calories: 320 },
          weight: 280
        }
      case 53: // Медальоны из мраморной говядины
        return {
          ...baseDetails,
          description: 'Сочные медальоны из мраморной говядины с жареными кабачками и перечным соусом.',
          ingredients: 'Говядина мраморная, кабачки, перец черный, сливки, тимьян, розмарин',
          nutrition: { proteins: 35, fats: 25, carbs: 6, calories: 370 },
          weight: 250
        }
      case 54: // Бефстроганов из мраморной говядины
        return {
          ...baseDetails,
          description: 'Классический бефстроганов из мраморной говядины с белыми грибами и картофельным пюре.',
          ingredients: 'Говядина мраморная, белые грибы, сметана, лук, картофель, сливочное масло',
          nutrition: { proteins: 30, fats: 20, carbs: 25, calories: 380 },
          weight: 350
        }
      case 55: // Биточки куриные с картофельным пюре
        return {
          ...baseDetails,
          description: 'Нежные куриные биточки с воздушным картофельным пюре и соусом из белых грибов.',
          ingredients: 'Куриное филе, картофель, белые грибы, сливки, сливочное масло, яйца',
          nutrition: { proteins: 25, fats: 15, carbs: 30, calories: 330 },
          weight: 300
        }
      case 56: // Пельмени с бульоном
        return {
          ...baseDetails,
          description: 'Домашние пельмени в ароматном бульоне со сметаной и свежей зеленью.',
          ingredients: 'Пельмени (говядина, свинина), бульон мясной, сметана, укроп, петрушка',
          nutrition: { proteins: 18, fats: 12, carbs: 35, calories: 300 },
          weight: 350
        }
      // Гарниры
      case 57: // Картофельное пюре
        return {
          ...baseDetails,
          description: 'Воздушное картофельное пюре на сливочном масле с молоком.',
          ingredients: 'Картофель, сливочное масло, молоко, соль, мускатный орех',
          nutrition: { proteins: 4, fats: 8, carbs: 25, calories: 170 },
          weight: 200
        }
      case 58: // Гречневая каша с грибами и луком
        return {
          ...baseDetails,
          description: 'Ароматная гречневая каша с жареными грибами и карамелизированным луком.',
          ingredients: 'Гречка, шампиньоны, лук, сливочное масло, зелень, специи',
          nutrition: { proteins: 8, fats: 6, carbs: 30, calories: 200 },
          weight: 250
        }
      case 59: // Картофель фри/по-деревенски
        return {
          ...baseDetails,
          description: 'Хрустящий картофель фри или по-деревенски с золотистой корочкой.',
          ingredients: 'Картофель, растительное масло, соль, специи, розмарин',
          nutrition: { proteins: 3, fats: 12, carbs: 28, calories: 220 },
          weight: 200
        }
      case 60: // Жареный картофель с грибами и луком
        return {
          ...baseDetails,
          description: 'Ароматный жареный картофель с грибами и золотистым луком.',
          ingredients: 'Картофель, шампиньоны, лук, растительное масло, зелень, специи',
          nutrition: { proteins: 5, fats: 10, carbs: 30, calories: 210 },
          weight: 250
        }
      case 61: // Рис Басмати
        return {
          ...baseDetails,
          description: 'Ароматный рис Басмати, приготовленный на пару с тонкими специями.',
          ingredients: 'Рис Басмати, сливочное масло, соль, куркума, кардамон',
          nutrition: { proteins: 6, fats: 4, carbs: 35, calories: 190 },
          weight: 200
        }
      case 62: // Овощи гриль
        return {
          ...baseDetails,
          description: 'Сезонные овощи гриль с ароматными травами и оливковым маслом.',
          ingredients: 'Кабачки, баклажаны, болгарский перец, томаты, лук, оливковое масло, тимьян',
          nutrition: { proteins: 4, fats: 8, carbs: 15, calories: 130 },
          weight: 200
        }
      default:
        return baseDetails
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* App Bar - Sticky Header */}
      <header className="sticky top-0 z-50 fixed-header py-3" style={{ background: 'linear-gradient(to top, #0B73FE, #5BA1FF)' }}>
        <div className="max-w-md mx-auto flex items-center justify-between">
          {/* Back Arrow */}
          <button 
            onClick={onNavigateToLanding}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <img 
              src="/logo_aero1.svg" 
              alt="Aero Lunch Logo" 
              className="object-contain"
              style={{ width: '40px', height: '26px' }}
            />
            <h1 className="font-bold" style={{ fontSize: '20px' }}>
              <span style={{ color: '#FA742D' }}>Aero</span>
              <span className="text-white"> Lunch</span>
            </h1>
          </div>
          
          {/* Profile Button */}
          <button 
            onClick={onNavigateToProfile}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Horizontal Categories Menu - Sticky */}
      <div className="sticky top-[54px] z-40 py-2 bg-white">
        <div 
          ref={categoriesMenuRef}
          className="flex overflow-x-auto space-x-3 scrollbar-hide pl-4 pr-0"
        >
          {categories.map((category) => {
            // Проверяем, является ли категория одной из новых (без контента)
            const isNewCategory = ['Любимые', 'Хиты продаж', 'Новинки'].includes(category)
            
            return (
            <button
              key={category}
              data-category={category}
                onClick={() => isNewCategory ? null : scrollToSection(category)}
              className={`flex-none px-6 py-2 font-medium rounded-full text-sm whitespace-nowrap transition-colors ${
                selectedCategory === category
                    ? 'bg-primary-900 text-white'
                    : isNewCategory 
                      ? 'border border-gray-300 text-gray-400 cursor-not-allowed'
                      : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
                disabled={isNewCategory}
            >
              {category}
            </button>
            )
          })}
        </div>
      </div>

      {/* Content Area с Tailwind scroll utilities */}
      <main className="py-6 pb-24 scroll-smooth">
        {/* Завтраки Section */}
        <div id="Завтраки" className="mb-4 scroll-mt-36">
          <div className="mb-3 content-safe">
            <h2 className="text-2xl font-bold flex items-center" style={{ color: '#313131' }}>
              <img 
                src="/Breakfast.svg" 
                alt="Завтрак" 
                className="mr-3 object-contain"
                style={{ width: '37px', height: '33px' }}
              />
              Завтрак
            </h2>
          </div>

          <div className="flex overflow-x-auto pb-4 scrollbar-hide pl-4 pr-0" style={{ gap: '10px' }}>
            {breakfastItems.map((item) => (
              <div
                key={item.id}
                className="flex-none bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col cursor-pointer"
                style={{ width: '170px', height: '300px' }}
                onClick={(e) => {
                  // Не открывать модальное окно при клике на кнопку цены
                  if (!(e.target as HTMLElement).closest('.price-button')) {
                    openDetailModal(item)
                  }
                }}
              >
                {/* Image - увеличенная зона */}
                <div className="bg-gray-100 flex items-center justify-center" style={{ height: '150px' }}>
                  <img
                    src={item.image}
                    alt={item.title}
                    className="object-contain opacity-60"
                    style={{ width: '43px', height: '40px' }}
                  />
                </div>

                {/* Content - фиксированная высота */}
                <div className="p-3 flex flex-col" style={{ height: '150px' }}>
                  <div style={{ height: '70px' }}>
                    <h3 className="font-bold text-primary-900 mb-1 leading-tight" style={{ fontSize: '12px' }}>
                    {item.title}
                  </h3>
                  
                    {item.description && (
                      <p className="text-gray-600 leading-tight" style={{ fontSize: '12px' }}>
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Price Button - в нижней части */}
                  <div className="mt-auto">
                    <PriceButton item={item} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Сэндвичи Section */}
        <div id="Сендвичи" className="mb-8 scroll-mt-36">
          <div className="mb-3 content-safe">
            <h2 className="text-2xl font-bold flex items-center" style={{ color: '#313131' }}>
              <img 
                src="/Sandwiches.svg" 
                alt="Сэндвичи" 
                className="mr-3 object-contain"
                style={{ width: '37px', height: '33px' }}
              />
              Сэндвичи
            </h2>
          </div>

          <div className="flex overflow-x-auto pb-4 scrollbar-hide pl-4 pr-0" style={{ gap: '10px' }}>
            {sandwichItems.map((item) => (
              <div
                key={item.id}
                className="flex-none bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col cursor-pointer"
                style={{ width: '170px', height: '300px' }}
                onClick={(e) => {
                  // Не открывать модальное окно при клике на кнопку цены
                  if (!(e.target as HTMLElement).closest('.price-button')) {
                    openDetailModal(item)
                  }
                }}
              >
                {/* Image - увеличенная зона */}
                <div className="bg-gray-100 flex items-center justify-center" style={{ height: '150px' }}>
                  <img
                    src={item.image}
                    alt={item.title}
                    className="object-contain opacity-60"
                    style={{ width: '43px', height: '40px' }}
                  />
                </div>

                {/* Content - фиксированная высота */}
                <div className="p-3 flex flex-col" style={{ height: '150px' }}>
                  <div style={{ height: '70px' }}>
                    <h3 className="font-bold text-primary-900 mb-1 leading-tight" style={{ fontSize: '12px' }}>
                    {item.title}
                  </h3>
                  
                    {item.description && (
                      <p className="text-gray-600 leading-tight" style={{ fontSize: '12px' }}>
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Price Button - в нижней части */}
                  <div className="mt-auto">
                    <PriceButton item={item} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Закуски на компанию Section */}
        <div id="Закуски на компанию" className="mb-4 scroll-mt-36">
          <div className="mb-3 content-safe">
            <h2 className="text-2xl font-bold flex items-center" style={{ color: '#313131' }}>
              <img 
                src="/Snacks.svg" 
                alt="Закуски на компанию" 
                className="mr-3 object-contain"
                style={{ width: '37px', height: '33px' }}
              />
              Закуски на компанию
            </h2>
          </div>

          <div className="flex overflow-x-auto pb-4 scrollbar-hide pl-4 pr-0" style={{ gap: '10px' }}>
            {snacksItems.map((item) => (
              <div
                key={item.id}
                className="flex-none bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col cursor-pointer"
                style={{ width: '170px', height: '300px' }}
                onClick={(e) => {
                  // Не открывать модальное окно при клике на кнопку цены
                  if (!(e.target as HTMLElement).closest('.price-button')) {
                    openDetailModal(item)
                  }
                }}
              >
                {/* Image - увеличенная зона */}
                <div className="bg-gray-100 flex items-center justify-center" style={{ height: '150px' }}>
                  <img
                    src={item.image}
                    alt={item.title}
                    className="object-contain opacity-60"
                    style={{ width: '43px', height: '40px' }}
                  />
                </div>

                {/* Content - фиксированная высота */}
                <div className="p-3 flex flex-col" style={{ height: '150px' }}>
                  <div style={{ height: '70px' }}>
                    <h3 className="font-bold text-primary-900 mb-1 leading-tight" style={{ fontSize: '12px' }}>
                    {item.title}
                  </h3>
                  
                    {item.description && (
                      <p className="text-gray-600 leading-tight" style={{ fontSize: '12px' }}>
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Price Button - в нижней части */}
                  <div className="mt-auto">
                    <PriceButton item={item} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Салаты Section */}
        <div id="Салаты" className="mb-4 scroll-mt-36">
          <div className="mb-3 content-safe">
            <h2 className="text-2xl font-bold flex items-center" style={{ color: '#313131' }}>
              <img 
                src="/salad.svg" 
                alt="Салаты" 
                className="mr-3 object-contain"
                style={{ width: '37px', height: '33px' }}
              />
              Салаты
            </h2>
          </div>

          <div className="flex overflow-x-auto pb-4 scrollbar-hide pl-4 pr-0" style={{ gap: '10px' }}>
            {saladsItems.map((item) => (
              <div
                key={item.id}
                className="flex-none bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col cursor-pointer"
                style={{ width: '170px', height: '300px' }}
                onClick={(e) => {
                  // Не открывать модальное окно при клике на кнопку цены
                  if (!(e.target as HTMLElement).closest('.price-button')) {
                    openDetailModal(item)
                  }
                }}
              >
                {/* Image - увеличенная зона */}
                <div className="bg-gray-100 flex items-center justify-center" style={{ height: '150px' }}>
                  <img
                    src={item.image}
                    alt={item.title}
                    className="object-contain opacity-60"
                    style={{ width: '43px', height: '40px' }}
                  />
                </div>

                {/* Content - фиксированная высота */}
                <div className="p-3 flex flex-col" style={{ height: '150px' }}>
                  <div style={{ height: '70px' }}>
                    <h3 className="font-bold text-primary-900 mb-1 leading-tight" style={{ fontSize: '12px' }}>
                    {item.title}
                  </h3>
                  
                    {item.description && (
                      <p className="text-gray-600 leading-tight" style={{ fontSize: '12px' }}>
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Price Button - в нижней части */}
                  <div className="mt-auto">
                    <PriceButton item={item} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Супы Section */}
        <div id="Супы" className="mb-4 scroll-mt-36">
          <div className="mb-3 content-safe">
            <h2 className="text-2xl font-bold flex items-center" style={{ color: '#313131' }}>
              <img 
                src="/SOUPS.png" 
                alt="Супы" 
                className="mr-3 object-contain"
                style={{ width: '37px', height: '33px' }}
              />
              Супы
            </h2>
          </div>

          <div className="flex overflow-x-auto pb-4 scrollbar-hide pl-4 pr-0" style={{ gap: '10px' }}>
            {soupsItems.map((item) => (
              <div
                key={item.id}
                className="flex-none bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col cursor-pointer"
                style={{ width: '170px', height: '300px' }}
                onClick={(e) => {
                  // Не открывать модальное окно при клике на кнопку цены
                  if (!(e.target as HTMLElement).closest('.price-button')) {
                    openDetailModal(item)
                  }
                }}
              >
                {/* Image - увеличенная зона */}
                <div className="bg-gray-100 flex items-center justify-center" style={{ height: '150px' }}>
                  <img
                    src={item.image}
                    alt={item.title}
                    className="object-contain opacity-60"
                    style={{ width: '43px', height: '40px' }}
                  />
                </div>

                {/* Content - фиксированная высота */}
                <div className="p-3 flex flex-col" style={{ height: '150px' }}>
                  <div style={{ height: '70px' }}>
                    <h3 className="font-bold text-primary-900 mb-1 leading-tight" style={{ fontSize: '12px' }}>
                    {item.title}
                  </h3>
                  
                    {item.description && (
                      <p className="text-gray-600 leading-tight" style={{ fontSize: '12px' }}>
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Price Button - в нижней части */}
                  <div className="mt-auto">
                    <PriceButton item={item} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Горячее Section */}
        <div id="Горячее" className="mb-4 scroll-mt-36">
          <div className="mb-3 content-safe">
            <h2 className="text-2xl font-bold flex items-center" style={{ color: '#313131' }}>
              <img 
                src="/hot.svg" 
                alt="Горячее" 
                className="mr-3 object-contain"
                style={{ width: '37px', height: '33px' }}
              />
              Горячее
            </h2>
          </div>

          <div className="flex overflow-x-auto pb-4 scrollbar-hide pl-4 pr-0" style={{ gap: '10px' }}>
            {hotItems.map((item) => (
              <div
                key={item.id}
                className="flex-none bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col cursor-pointer"
                style={{ width: '170px', height: '300px' }}
                onClick={(e) => {
                  // Не открывать модальное окно при клике на кнопку цены
                  if (!(e.target as HTMLElement).closest('.price-button')) {
                    openDetailModal(item)
                  }
                }}
              >
                {/* Image - увеличенная зона */}
                <div className="bg-gray-100 flex items-center justify-center" style={{ height: '150px' }}>
                  <img
                    src={item.image}
                    alt={item.title}
                    className="object-contain opacity-60"
                    style={{ width: '43px', height: '40px' }}
                  />
                </div>

                {/* Content - фиксированная высота */}
                <div className="p-3 flex flex-col" style={{ height: '150px' }}>
                  <div style={{ height: '70px' }}>
                    <h3 className="font-bold text-primary-900 mb-1 leading-tight" style={{ fontSize: '12px' }}>
                    {item.title}
                  </h3>
                  
                    {item.description && (
                      <p className="text-gray-600 leading-tight" style={{ fontSize: '12px' }}>
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Price Button - в нижней части */}
                  <div className="mt-auto">
                    <PriceButton item={item} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Гарниры Section */}
        <div id="Гарниры" className="mb-4 scroll-mt-36">
          <div className="mb-3 content-safe">
            <h2 className="text-2xl font-bold flex items-center" style={{ color: '#313131' }}>
              <img 
                src="/broccoli.svg" 
                alt="Гарниры" 
                className="mr-3 object-contain"
                style={{ width: '37px', height: '33px' }}
              />
              Гарниры
            </h2>
          </div>

          <div className="flex overflow-x-auto pb-4 scrollbar-hide pl-4 pr-0" style={{ gap: '10px' }}>
            {sidesItems.map((item) => (
              <div
                key={item.id}
                className="flex-none bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col cursor-pointer"
                style={{ width: '170px', height: '300px' }}
                onClick={(e) => {
                  // Не открывать модальное окно при клике на кнопку цены
                  if (!(e.target as HTMLElement).closest('.price-button')) {
                    openDetailModal(item)
                  }
                }}
              >
                {/* Image - увеличенная зона */}
                <div className="bg-gray-100 flex items-center justify-center" style={{ height: '150px' }}>
                  <img
                    src={item.image}
                    alt={item.title}
                    className="object-contain opacity-60"
                    style={{ width: '43px', height: '40px' }}
                  />
                </div>

                {/* Content - фиксированная высота */}
                <div className="p-3 flex flex-col" style={{ height: '150px' }}>
                  <div style={{ height: '70px' }}>
                    <h3 className="font-bold text-primary-900 mb-1 leading-tight" style={{ fontSize: '12px' }}>
                    {item.title}
                  </h3>
                  
                    {item.description && (
                      <p className="text-gray-600 leading-tight" style={{ fontSize: '12px' }}>
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Price Button - в нижней части */}
                  <div className="mt-auto">
                    <PriceButton item={item} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>



      {/* Cart Button */}
      {showCartButton && (
        <div 
          className={`fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 fixed-bottom py-3 ${
            cartButtonAnimating ? 'animate-slide-down' : 'animate-slide-up'
          }`}
          style={{ borderTopLeftRadius: '15px', borderTopRightRadius: '15px' }}
        >
          <div className="content-safe">
          <button 
              className="w-full text-white font-semibold transition-colors flex items-center justify-between px-6 rounded-full"
              style={{ 
                backgroundColor: '#1F1F1F',
                height: '42px',
                fontSize: '14px'
              }}
              onClick={onNavigateToCart}
          >
            <span>Перейти в корзину</span>
            <div className="flex items-center gap-2">
            <span>{getTotalPrice()}₽</span>
              <div 
                className="flex items-center justify-center text-white font-semibold rounded-full min-w-[24px] h-6 px-2"
                style={{ 
                  backgroundColor: '#FA742D',
                  fontSize: '12px'
                }}
              >
                {getTotalItems()}
              </div>
            </div>
          </button>
          </div>
        </div>
      )}

      {/* Variant Selection Modal */}
      {showVariantModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-3xl w-full max-w-md p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-primary-900">
                {selectedItem.title}
              </h3>
              <button 
                onClick={closeVariantModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 text-sm mb-4">Выберите вариант:</p>
              
              <div className="space-y-3">
                {getItemVariants(selectedItem.id).map((variant, index) => (
                  <button
                    key={index}
                    onClick={() => selectVariant(variant)}
                    className="w-full p-4 text-left border border-gray-200 rounded-xl transition-colors"
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#FA742D';
                  e.currentTarget.style.backgroundColor = '#FFF5F0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.backgroundColor = 'white';
                }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-primary-900 capitalize">{variant}</span>
                      <span className="text-black">{selectedItem.price}₽</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedDetailItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50 modal-overlay">
          <div 
            className="bg-white rounded-t-3xl w-full max-w-md max-h-[95vh] overflow-y-auto animate-slide-up"
            onTouchStart={(e) => {
              // Добавляем обработку свайпа для всех карточек
              const touch = e.touches[0]
              const startY = touch.clientY
              let currentY = startY
              const modalElement = e.currentTarget as HTMLElement
              
              const handleTouchMove = (e: TouchEvent) => {
                const touch = e.touches[0]
                currentY = touch.clientY
                const deltaY = currentY - startY
                
                // Только если свайп вниз и прокрутка вверху
                if (deltaY > 0 && modalElement.scrollTop === 0) {
                  e.preventDefault()
                  
                  // Добавляем визуальную обратную связь - плавное смещение
                  const translateY = Math.min(deltaY * 0.5, 50) // Ограничиваем максимальное смещение
                  modalElement.style.transform = `translateY(${translateY}px)`
                  modalElement.style.transition = 'none'
                  
                  // Добавляем прозрачность фона
                  const overlay = document.querySelector('.modal-overlay') as HTMLElement
                  if (overlay) {
                    const opacity = Math.max(0.5, 1 - deltaY * 0.003)
                    overlay.style.backgroundColor = `rgba(0, 0, 0, ${opacity})`
                  }
                }
              }
              
              const handleTouchEnd = () => {
                const deltaY = currentY - startY
                
                // Восстанавливаем плавные переходы
                modalElement.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                
                const overlay = document.querySelector('.modal-overlay') as HTMLElement
                if (overlay) {
                  overlay.style.transition = 'background-color 0.3s ease'
                }
                
                // Если свайп вниз больше 100px - закрываем модальное окно
                if (deltaY > 100) {
                  modalElement.style.transform = 'translateY(100%)'
                  if (overlay) {
                    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0)'
                  }
                  setTimeout(() => {
                    closeDetailModal()
                  }, 300)
                } else {
                  // Возвращаем в исходное положение
                  modalElement.style.transform = 'translateY(0)'
                  if (overlay) {
                    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'
                  }
                }
                
                document.removeEventListener('touchmove', handleTouchMove)
                document.removeEventListener('touchend', handleTouchEnd)
              }
              
              document.addEventListener('touchmove', handleTouchMove, { passive: false })
              document.addEventListener('touchend', handleTouchEnd)
            }}
          >
            {/* Image Swiper - Full width at top */}
              <div className="relative mb-3">
                <div 
                className="h-64 bg-gray-100 flex items-center justify-center overflow-hidden touch-pan-x relative"
                  onTouchStart={(e) => {
                    const touch = e.touches[0]
                    const startX = touch.clientX
                    
                    const handleTouchMove = (e: TouchEvent) => {
                      const touch = e.touches[0]
                      const deltaX = touch.clientX - startX
                      
                      if (Math.abs(deltaX) > 50) {
                        if (deltaX > 0 && currentImageIndex > 0) {
                          setCurrentImageIndex(currentImageIndex - 1)
                        } else if (deltaX < 0 && currentImageIndex < selectedDetailItem.images.length - 1) {
                          setCurrentImageIndex(currentImageIndex + 1)
                        }
                        document.removeEventListener('touchmove', handleTouchMove)
                      }
                    }
                    
                    document.addEventListener('touchmove', handleTouchMove)
                    document.addEventListener('touchend', () => {
                      document.removeEventListener('touchmove', handleTouchMove)
                    }, { once: true })
                  }}
                >
                  <img
                    src={selectedDetailItem.images[currentImageIndex]}
                    alt={selectedDetailItem.title}
                  className="w-48 h-48 object-contain opacity-60"
                />
                
                {/* Close button overlay */}
                <button 
                  onClick={closeDetailModal}
                  className="absolute top-3 right-3 w-8 h-8 bg-white bg-opacity-80 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-800 hover:bg-opacity-100 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                
                {/* Drag indicator */}
                <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-white bg-opacity-60 rounded-full"></div>
                </div>
              
                {/* Dots indicator */}
                <div className="flex justify-center mt-2 space-x-1">
                  {selectedDetailItem.images.map((_: string, index: number) => (
                    <div
                      key={index}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ 
                      backgroundColor: index === currentImageIndex ? '#FA742D' : '#D1D5DB' 
                    }}
                    />
                  ))}
                </div>
              </div>

            {/* Content with padding */}
            <div className="px-3 pb-4">
              {/* Title and price */}
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold mb-0 flex-1 pr-3" style={{ color: '#636363' }}>
                {selectedDetailItem.title}
              </h3>
                <span className="text-lg font-bold text-black">
                  {selectedDetailItem.price} ₽
                </span>
              </div>
              
              <p className="text-gray-600 text-xs mb-2 leading-relaxed">
                {selectedDetailItem.description}
              </p>

              {/* Ingredients */}
              <div className="mb-2">
                <h4 className="font-semibold text-primary-900 mb-1 text-sm">Состав:</h4>
                <p className="text-gray-600 text-xs leading-relaxed">
                  {selectedDetailItem.ingredients}
                </p>
              </div>

              {/* Nutrition info */}
              <div className="mb-3">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold text-sm" style={{ color: '#1F1F1F' }}>Пищевая ценность:</h4>
                  <span className="text-sm" style={{ color: '#1F1F1F' }}>{selectedDetailItem.weight} г</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <div className="text-center">
                    <div className="font-medium text-primary-900">Белки</div>
                    <div className="text-gray-600">{selectedDetailItem.nutrition.proteins}</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-primary-900">Жиры</div>
                    <div className="text-gray-600">{selectedDetailItem.nutrition.fats}</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-primary-900">Углеводы</div>
                    <div className="text-gray-600">{selectedDetailItem.nutrition.carbs}</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-primary-900">Энерго. ценн</div>
                    <div className="text-gray-600">{selectedDetailItem.nutrition.calories}</div>
                  </div>
                </div>
              </div>

              {/* Variants section for items with options */}
              {hasVariants(selectedDetailItem.id) && (
                <div className="border-t border-gray-200 pt-3 mb-3">
                  <h4 className="font-semibold text-primary-900 mb-2 text-sm">Выберите вариант:</h4>
                  <div className="space-y-2">
                    {getItemVariants(selectedDetailItem.id).map((variant, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          addToCart(selectedDetailItem, variant)
                          closeDetailModal()
                        }}
                        className="w-full p-3 text-left border border-gray-200 rounded-xl transition-colors"
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#FA742D';
                  e.currentTarget.style.backgroundColor = '#FFF5F0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.backgroundColor = 'white';
                }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-primary-900 capitalize text-sm">{variant}</span>
                          <span className="text-black font-semibold">{selectedDetailItem.price} ₽</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom section with buttons */}
              <div className="border-t border-gray-200 pt-3 mt-3">
                {/* Show regular add to cart for items without variants */}
                {!hasVariants(selectedDetailItem.id) && (
                  <div className="flex items-center gap-3">
                    {/* Quantity selector */}
                    <div className="flex items-center bg-gray-100 rounded-full overflow-hidden" style={{ flex: '2' }}>
                      <button 
                        onClick={() => {
                          const currentQuantity = getCartItemQuantity(selectedDetailItem.id) || 1
                          if (currentQuantity > 1) {
                            removeFromCart(selectedDetailItem.id)
                          }
                        }}
                        className="p-2 hover:bg-gray-200 transition-colors"
                      >
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      <div className="px-3 py-2 font-semibold text-primary-900 min-w-[40px] text-center text-sm flex-1">
                        {getCartItemQuantity(selectedDetailItem.id) || 1}
                      </div>
                      <button 
                        onClick={() => addToCart(selectedDetailItem)}
                        className="p-2 hover:bg-gray-200 transition-colors"
                      >
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </button>
                    </div>

                    {/* Add to cart button */}
                    <button 
                      onClick={() => {
                        addToCart(selectedDetailItem)
                        closeDetailModal()
                      }}
                      className="text-white font-semibold py-2.5 px-6 rounded-full transition-colors text-sm"
                      style={{ backgroundColor: '#1F1F1F', flex: '3' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#333333';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#1F1F1F';
                }}
                    >
                      Добавить
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  )
} 