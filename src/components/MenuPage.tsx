import { useState, useRef, useEffect } from 'react'

interface MenuPageProps {
  onNavigateToLanding: () => void
  onNavigateToCart: () => void
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

export default function MenuPage({ onNavigateToLanding, onNavigateToCart, cart, onUpdateCart }: MenuPageProps) {
  const [selectedCategory, setSelectedCategory] = useState('Завтраки')
  const [showVariantModal, setShowVariantModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<{ id: number; title: string; price: number } | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedDetailItem, setSelectedDetailItem] = useState<DetailedMenuItem | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  
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
              className="w-full bg-gray-100 hover:bg-gray-200 text-primary-900 font-semibold text-sm py-2 px-3 rounded-xl transition-colors h-10 flex items-center justify-center"
            >
              {item.price}₽
            </button>
          </div>
        )
      }
      
      return (
        <div className="price-button">
          <div className="flex items-center bg-white border-2 border-accent-500 rounded-xl h-10">
            <button 
              onClick={() => removeVariantItemFromCart(item.id)}
              className="text-primary-900 font-bold text-lg px-3 py-2 flex-none"
            >
              -
            </button>
            <div className="flex-1 text-center text-primary-900 font-semibold text-sm">
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
            className="w-full bg-gray-100 hover:bg-gray-200 text-primary-900 font-semibold text-sm py-2 px-3 rounded-xl transition-colors h-10 flex items-center justify-center"
          >
            {item.price}₽
          </button>
        </div>
      )
    }
    
    return (
      <div className="price-button">
        <div className="flex items-center bg-white border-2 border-accent-500 rounded-xl h-10">
          <button 
            onClick={() => removeFromCart(item.id)}
            className="text-primary-900 font-bold text-lg px-3 py-2 flex-none"
          >
            -
          </button>
          <div className="flex-1 text-center text-primary-900 font-semibold text-sm">
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
    'Завтраки',
    'Сендвичи',
    'Закуски на компанию',
    'Салаты',
    'Супы',
    'Горячее',
    'Гарниры'
  ]

  // Простая функция для скролла к секции
  // Простая функция для скролла к секции
  const scrollToSection = (category: string) => {
    // Помечаем что это ручной выбор
    isManualSelection.current = true
    setSelectedCategory(category)
    
    // Небольшая задержка чтобы горизонтальный скролл не мешал
    setTimeout(() => {
      const element = document.getElementById(category)
      if (element) {
        element.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        })
      }
    }, 100)
  }

  // Используем IntersectionObserver для отслеживания видимых секций
  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '-30% 0px -60% 0px', // Учитываем только среднюю часть экрана
      threshold: 0
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setSelectedCategory(entry.target.id)
        }
      })
    }, options)

    // Наблюдаем за всеми секциями
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

    return () => observer.disconnect()
  }, [])



  // Автоматический скролл горизонтального меню к активной кнопке
  useEffect(() => {
    // Не скроллим горизонтальное меню если категория была выбрана кликом
    if (!isManualSelection.current) {
      const timer = setTimeout(() => {
        if (categoriesMenuRef.current) {
          const activeButton = categoriesMenuRef.current.querySelector(`[data-category="${selectedCategory}"]`) as HTMLButtonElement
          if (activeButton) {
            activeButton.scrollIntoView({
              behavior: 'smooth',
              block: 'nearest',
              inline: 'center'
            })
          }
        }
      }, 50)
      
      return () => clearTimeout(timer)
    }
    // Сбрасываем флаг после использования
    isManualSelection.current = false
  }, [selectedCategory])

  const breakfastItems = [
    {
      id: 1,
      title: 'Каша овсяная со свежими ягодами на выбор',
      description: 'на воде\\молоке\\ альтернативном молоке',
      price: 900,
      image: '/logo_aero3.svg'
    },
    {
      id: 2,
      title: 'Каша пшённая с чатни из тыквы на выбор',
      description: 'на молоке\\альтернативном молоке',
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
      title: 'Блинчики с творогом на выбор',
      description: 'со сметаной\\сгущенным молоком',
      price: 1300,
      image: '/logo_aero3.svg'
    },
    {
      id: 5,
      title: 'Сырники со свежими ягодами на выбор',
      description: 'вареньем из вишни\\сметаной\\сгущённым молоком',
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
      title: 'Блинчики с маслом и ягодами, на выбор',
      description: 'вареньем из вишни\\сметаной\\сгущённым молоком',
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
      images: ['/logo_aero3.svg', '/logo_aero3.svg'] // Пока используем заглушки
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
      case 5: // Сырники
        return {
          ...baseDetails,
          description: 'Классические сырники со свежими ягодами и вашим любимым соусом.',
          ingredients: 'Творог, мука, яйца, сахар, свежие ягоды, варенье/сметана/сгущённое молоко',
          nutrition: { proteins: 20, fats: 12, carbs: 25, calories: 280 },
          weight: 180
        }
      default:
        return baseDetails
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* App Bar - Sticky Header */}
      <header className="sticky top-0 z-50 px-4 py-3 bg-primary-900">
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
              className="w-8 h-8 object-contain"
            />
            <h1 className="text-xl font-bold">
              <span className="text-accent-500">Aero</span>
              <span className="text-white"> Lunch</span>
            </h1>
          </div>
          
          {/* Empty div for spacing */}
          <div className="w-6"></div>
        </div>
      </header>

      {/* Horizontal Categories Menu - Sticky */}
      <div className="sticky top-[56px] z-40 px-4 py-2 bg-white border-b border-gray-200">
        <div 
          ref={categoriesMenuRef}
          className="flex overflow-x-auto space-x-3 scrollbar-hide"
        >
          {categories.map((category) => (
            <button
              key={category}
              data-category={category}
              onClick={() => scrollToSection(category)}
              className={`flex-none px-6 py-2 font-medium rounded-full text-sm whitespace-nowrap transition-colors ${
                selectedCategory === category
                  ? 'bg-accent-500 text-primary-900'
                  : 'border border-accent-500 text-accent-500 hover:bg-accent-50'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area с Tailwind scroll utilities */}
      <main className="px-4 py-6 pb-24 scroll-smooth">
        {/* Завтраки Section */}
        <div id="Завтраки" className="mb-8 scroll-mt-36">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-primary-900">
              Завтрак
            </h2>
          </div>

          <div className="flex overflow-x-auto pb-4 scrollbar-hide" style={{ gap: '10px' }}>
            {breakfastItems.map((item) => (
              <div
                key={item.id}
                className="flex-none w-52 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col cursor-pointer"
                style={{ height: '320px' }}
                onClick={(e) => {
                  // Не открывать модальное окно при клике на кнопку цены
                  if (!(e.target as HTMLElement).closest('.price-button')) {
                    openDetailModal(item)
                  }
                }}
              >
                {/* Image */}
                <div className="h-40 bg-gray-100 flex items-center justify-center">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-32 h-32 object-contain opacity-60"
                  />
                </div>

                {/* Content */}
                <div className="p-3 flex-1 flex flex-col">
                  <h3 className="font-bold text-primary-900 text-sm mb-2 leading-tight">
                    {item.title}
                  </h3>
                  
                  <div className="flex-1">
                    {item.description && (
                      <p className="text-gray-600 text-xs leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Price Button */}
                  <div className="mt-3" style={{ paddingBottom: '10px' }}>
                    <PriceButton item={item} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Сэндвичи Section */}
        <div id="Сендвичи" className="mb-8 scroll-mt-36">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-primary-900">
              Сэндвичи
            </h2>
          </div>

          <div className="flex overflow-x-auto pb-4 scrollbar-hide" style={{ gap: '10px' }}>
            {sandwichItems.map((item) => (
              <div
                key={item.id}
                className="flex-none w-52 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col cursor-pointer"
                style={{ height: '320px' }}
                onClick={(e) => {
                  // Не открывать модальное окно при клике на кнопку цены
                  if (!(e.target as HTMLElement).closest('.price-button')) {
                    openDetailModal(item)
                  }
                }}
              >
                {/* Image */}
                <div className="h-40 bg-gray-100 flex items-center justify-center">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-32 h-32 object-contain opacity-60"
                  />
                </div>

                {/* Content */}
                <div className="p-3 flex-1 flex flex-col">
                  <h3 className="font-bold text-primary-900 text-sm mb-2 leading-tight">
                    {item.title}
                  </h3>
                  
                  <div className="flex-1">
                    {item.description && (
                      <p className="text-gray-600 text-xs leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Price Button */}
                  <div className="mt-3" style={{ paddingBottom: '10px' }}>
                    <PriceButton item={item} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Закуски на компанию Section */}
        <div id="Закуски на компанию" className="mb-8 scroll-mt-36">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-primary-900">
              Закуски на компанию
            </h2>
          </div>

          <div className="flex overflow-x-auto pb-4 scrollbar-hide" style={{ gap: '10px' }}>
            {snacksItems.map((item) => (
              <div
                key={item.id}
                className="flex-none w-52 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col cursor-pointer"
                style={{ height: '320px' }}
                onClick={(e) => {
                  // Не открывать модальное окно при клике на кнопку цены
                  if (!(e.target as HTMLElement).closest('.price-button')) {
                    openDetailModal(item)
                  }
                }}
              >
                {/* Image */}
                <div className="h-40 bg-gray-100 flex items-center justify-center">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-32 h-32 object-contain opacity-60"
                  />
                </div>

                {/* Content */}
                <div className="p-3 flex-1 flex flex-col">
                  <h3 className="font-bold text-primary-900 text-sm mb-2 leading-tight">
                    {item.title}
                  </h3>
                  
                  <div className="flex-1">
                    {item.description && (
                      <p className="text-gray-600 text-xs leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Price Button */}
                  <div className="mt-3" style={{ paddingBottom: '10px' }}>
                    <PriceButton item={item} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Салаты Section */}
        <div id="Салаты" className="mb-8 scroll-mt-36">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-primary-900">
              Салаты
            </h2>
          </div>

          <div className="flex overflow-x-auto pb-4 scrollbar-hide" style={{ gap: '10px' }}>
            {saladsItems.map((item) => (
              <div
                key={item.id}
                className="flex-none w-52 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col cursor-pointer"
                style={{ height: '320px' }}
                onClick={(e) => {
                  // Не открывать модальное окно при клике на кнопку цены
                  if (!(e.target as HTMLElement).closest('.price-button')) {
                    openDetailModal(item)
                  }
                }}
              >
                {/* Image */}
                <div className="h-40 bg-gray-100 flex items-center justify-center">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-32 h-32 object-contain opacity-60"
                  />
                </div>

                {/* Content */}
                <div className="p-3 flex-1 flex flex-col">
                  <h3 className="font-bold text-primary-900 text-sm mb-2 leading-tight">
                    {item.title}
                  </h3>
                  
                  <div className="flex-1">
                    {item.description && (
                      <p className="text-gray-600 text-xs leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Price Button */}
                  <div className="mt-3" style={{ paddingBottom: '10px' }}>
                    <PriceButton item={item} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Супы Section */}
        <div id="Супы" className="mb-8 scroll-mt-36">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-primary-900">
              Супы
            </h2>
          </div>

          <div className="flex overflow-x-auto pb-4 scrollbar-hide" style={{ gap: '10px' }}>
            {soupsItems.map((item) => (
              <div
                key={item.id}
                className="flex-none w-52 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col cursor-pointer"
                style={{ height: '320px' }}
                onClick={(e) => {
                  // Не открывать модальное окно при клике на кнопку цены
                  if (!(e.target as HTMLElement).closest('.price-button')) {
                    openDetailModal(item)
                  }
                }}
              >
                {/* Image */}
                <div className="h-40 bg-gray-100 flex items-center justify-center">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-32 h-32 object-contain opacity-60"
                  />
                </div>

                {/* Content */}
                <div className="p-3 flex-1 flex flex-col">
                  <h3 className="font-bold text-primary-900 text-sm mb-2 leading-tight">
                    {item.title}
                  </h3>
                  
                  <div className="flex-1">
                    {item.description && (
                      <p className="text-gray-600 text-xs leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Price Button */}
                  <div className="mt-3" style={{ paddingBottom: '10px' }}>
                    <PriceButton item={item} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Горячее Section */}
        <div id="Горячее" className="mb-8 scroll-mt-36">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-primary-900">
              Горячее
            </h2>
          </div>

          <div className="flex overflow-x-auto pb-4 scrollbar-hide" style={{ gap: '10px' }}>
            {hotItems.map((item) => (
              <div
                key={item.id}
                className="flex-none w-52 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col cursor-pointer"
                style={{ height: '320px' }}
                onClick={(e) => {
                  // Не открывать модальное окно при клике на кнопку цены
                  if (!(e.target as HTMLElement).closest('.price-button')) {
                    openDetailModal(item)
                  }
                }}
              >
                {/* Image */}
                <div className="h-40 bg-gray-100 flex items-center justify-center">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-32 h-32 object-contain opacity-60"
                  />
                </div>

                {/* Content */}
                <div className="p-3 flex-1 flex flex-col">
                  <h3 className="font-bold text-primary-900 text-sm mb-2 leading-tight">
                    {item.title}
                  </h3>
                  
                  <div className="flex-1">
                    {item.description && (
                      <p className="text-gray-600 text-xs leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Price Button */}
                  <div className="mt-3" style={{ paddingBottom: '10px' }}>
                    <PriceButton item={item} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Гарниры Section */}
        <div id="Гарниры" className="mb-8 scroll-mt-36">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-primary-900">
              Гарниры
            </h2>
          </div>

          <div className="flex overflow-x-auto pb-4 scrollbar-hide" style={{ gap: '10px' }}>
            {sidesItems.map((item) => (
              <div
                key={item.id}
                className="flex-none w-52 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col cursor-pointer"
                style={{ height: '320px' }}
                onClick={(e) => {
                  // Не открывать модальное окно при клике на кнопку цены
                  if (!(e.target as HTMLElement).closest('.price-button')) {
                    openDetailModal(item)
                  }
                }}
              >
                {/* Image */}
                <div className="h-40 bg-gray-100 flex items-center justify-center">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-32 h-32 object-contain opacity-60"
                  />
                </div>

                {/* Content */}
                <div className="p-3 flex-1 flex flex-col">
                  <h3 className="font-bold text-primary-900 text-sm mb-2 leading-tight">
                    {item.title}
                  </h3>
                  
                  <div className="flex-1">
                    {item.description && (
                      <p className="text-gray-600 text-xs leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Price Button */}
                  <div className="mt-3" style={{ paddingBottom: '10px' }}>
                    <PriceButton item={item} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Cart Button */}
      {getTotalItems() > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-50">
          <button 
            className="w-full bg-accent-500 hover:bg-accent-600 text-white font-bold py-4 px-6 rounded-2xl shadow-lg transition-colors flex items-center justify-between"
            onClick={onNavigateToCart}
          >
            <span>Перейти в корзину</span>
            <span>{getTotalPrice()}₽</span>
          </button>
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
                    className="w-full p-4 text-left border border-gray-200 rounded-xl hover:border-accent-500 hover:bg-accent-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-primary-900 capitalize">{variant}</span>
                      <span className="text-gray-600">{selectedItem.price}₽</span>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-3xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-slide-up">
            {/* Header with close button */}
            <div className="sticky top-0 bg-white p-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="w-8 h-1 bg-gray-300 rounded-full mx-auto"></div>
                <button 
                  onClick={closeDetailModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Image Swiper */}
            <div className="px-3 py-2">
              <div className="relative mb-3">
                <div 
                  className="h-40 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden touch-pan-x"
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
                    className="w-32 h-32 object-contain opacity-60"
                  />
                </div>
                {/* Dots indicator */}
                <div className="flex justify-center mt-2 space-x-1">
                  {selectedDetailItem.images.map((_: string, index: number) => (
                    <div
                      key={index}
                      className={`w-1.5 h-1.5 rounded-full ${index === currentImageIndex ? 'bg-accent-500' : 'bg-gray-300'}`}
                    />
                  ))}
                </div>
              </div>

              {/* Title and description */}
              <h3 className="text-lg font-bold text-primary-900 mb-2">
                {selectedDetailItem.title}
              </h3>
              
              <p className="text-gray-600 text-xs mb-3 leading-relaxed">
                {selectedDetailItem.description}
              </p>

              {/* Ingredients */}
              <div className="mb-3">
                <h4 className="font-semibold text-primary-900 mb-1 text-sm">Состав:</h4>
                <p className="text-gray-600 text-xs leading-relaxed">
                  {selectedDetailItem.ingredients}
                </p>
              </div>

              {/* Nutrition info */}
              <div className="mb-4">
                <h4 className="font-semibold text-primary-900 mb-2 text-sm">Пищевая ценность:</h4>
                <div className="flex justify-between items-center text-xs mb-2">
                  <span className="text-gray-600">{selectedDetailItem.weight} г</span>
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
                        className="w-full p-3 text-left border border-gray-200 rounded-xl hover:border-accent-500 hover:bg-accent-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-primary-900 capitalize text-sm">{variant}</span>
                          <span className="text-accent-500 font-semibold">{selectedDetailItem.price} ₽</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom section with price and buttons */}
              <div className="border-t border-gray-200 pt-3">
                <div className="flex items-center justify-end mb-3">
                  <span className="text-lg font-bold text-accent-500">
                    {selectedDetailItem.price} ₽
                  </span>
                </div>

                {/* Show regular add to cart for items without variants */}
                {!hasVariants(selectedDetailItem.id) && (
                  <div className="flex items-center gap-3">
                    {/* Quantity selector */}
                    <div className="flex items-center bg-gray-100 rounded-xl overflow-hidden">
                      <button 
                        onClick={() => {
                          const currentQuantity = getCartItemQuantity(selectedDetailItem.id)
                          if (currentQuantity > 0) {
                            removeFromCart(selectedDetailItem.id)
                          }
                        }}
                        className="p-2 hover:bg-gray-200 transition-colors"
                      >
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      <div className="px-3 py-2 font-semibold text-primary-900 min-w-[40px] text-center text-sm">
                        {getCartItemQuantity(selectedDetailItem.id)}
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
                      className="flex-1 bg-accent-500 hover:bg-accent-600 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors text-sm"
                    >
                      Добавить в корзину
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