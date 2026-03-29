import { startTransition, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

// 模态框常量对象
export const ROUTES = {
  HOME: '',
  SETTINGS: 'settings',
  SEARCH: 'search',
  EXPORT: 'export',
  SAVE_AS: 'save-as',
  SPARKLE: 'sparkle',
  LAUNCHER: 'launcher',
} as const;

// 从 ROUTES 动态推断出的模态框类型
export type ModalRoute = typeof ROUTES[keyof typeof ROUTES];

// 检查值是否为有效的模态框值
const isValidModalRoute = (value: string): value is ModalRoute => {
  return (Object.values(ROUTES) as readonly string[]).includes(value);
};

interface UseModalRouteReturn {
  // 当前模态框类型
  currentRoute: ModalRoute;
  // 是否打开指定模态框
  isModalOpen: (modal: ModalRoute) => boolean;
  // 打开模态框
  openModal: (modal: ModalRoute) => void;
  // 关闭模态框（返回编辑器主页）
  closeModal: () => void;
  // 关闭所有模态框
  closeAllModals: () => void;
}

export function useModalRoute(): UseModalRouteReturn {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // 从 query string 获取 modal 参数
  const modalParam = searchParams.get('modal') || '';
  
  // 当前模态框类型（如果不在有效值中，则默认为空字符串/主页）
  const currentRoute: ModalRoute = isValidModalRoute(modalParam) 
    ? modalParam as ModalRoute 
    : ROUTES.HOME;

  // 检查指定模态框是否打开
  const isModalOpen = useCallback((modal: ModalRoute): boolean => {
    return currentRoute === modal;
  }, [currentRoute]);

  // 打开指定模态框
  const openModal = useCallback((modal: ModalRoute) => {
    startTransition(() => {
      if (modal === ROUTES.HOME) {
        navigate('/');
      } else {
        navigate(`/?modal=${modal}`);
      }
    });
  }, [navigate]);

  // 关闭模态框（返回编辑器主页）
  const closeModal = useCallback(() => {
    startTransition(() => {
      navigate('/');
    });
  }, [navigate]);

  // 关闭所有模态框
  const closeAllModals = useCallback(() => {
    startTransition(() => {
      navigate('/');
    });
  }, [navigate]);

  return {
    currentRoute,
    isModalOpen,
    openModal,
    closeModal,
    closeAllModals,
  };
}
