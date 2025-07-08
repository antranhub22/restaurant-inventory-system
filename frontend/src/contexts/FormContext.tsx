import React, { createContext, useContext, useEffect, useState } from 'react';
import { FormTemplate, FormType } from '../types/form-template';
import { io, Socket } from 'socket.io-client';

interface FormContextType {
  templates: Map<string, FormTemplate>;
  getTemplate: (type: FormType, id?: string) => Promise<FormTemplate | null>;
  updateTemplate: (template: FormTemplate) => Promise<void>;
  subscribeToUpdates: (callback: (update: any) => void) => void;
}

const FormContext = createContext<FormContextType | undefined>(undefined);

export const useForm = () => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useForm must be used within a FormProvider');
  }
  return context;
};

interface FormProviderProps {
  children: React.ReactNode;
}

export const FormProvider: React.FC<FormProviderProps> = ({ children }) => {
  const [templates, setTemplates] = useState<Map<string, FormTemplate>>(new Map());
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Khởi tạo WebSocket connection
    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:3000');
    setSocket(newSocket);

    // Lắng nghe sự kiện cập nhật form
    newSocket.on('form-update', (update: any) => {
      handleFormUpdate(update);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const handleFormUpdate = async (update: any) => {
    if (update.type === 'UPDATE') {
      const template = await fetchTemplate(update.formType, update.formId);
      if (template) {
        setTemplates(prev => {
          const next = new Map(prev);
          next.set(getTemplateKey(template.type, template.id), template);
          return next;
        });
      }
    } else if (update.type === 'DELETE') {
      setTemplates(prev => {
        const next = new Map(prev);
        next.delete(getTemplateKey(update.formType, update.formId));
        return next;
      });
    }
  };

  const getTemplateKey = (type: FormType, id?: string): string => {
    return id ? `${type}:${id}` : `${type}:default`;
  };

  const fetchTemplate = async (type: FormType, id?: string): Promise<FormTemplate | null> => {
    try {
      const response = await fetch(`/api/templates/${type}${id ? `/${id}` : '/default'}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch template:', error);
      return null;
    }
  };

  const getTemplate = async (type: FormType, id?: string): Promise<FormTemplate | null> => {
    const key = getTemplateKey(type, id);
    
    // Thử lấy từ local cache
    let template = templates.get(key);
    
    if (!template) {
      // Nếu không có trong cache, fetch từ server
      template = await fetchTemplate(type, id);
      if (template) {
        setTemplates(prev => {
          const next = new Map(prev);
          next.set(key, template!);
          return next;
        });
      }
    }
    
    return template || null;
  };

  const updateTemplate = async (template: FormTemplate): Promise<void> => {
    try {
      const response = await fetch(`/api/templates/${template.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(template),
      });

      if (!response.ok) {
        throw new Error('Failed to update template');
      }

      const updated = await response.json();
      setTemplates(prev => {
        const next = new Map(prev);
        next.set(getTemplateKey(updated.type, updated.id), updated);
        return next;
      });
    } catch (error) {
      console.error('Failed to update template:', error);
      throw error;
    }
  };

  const subscribeToUpdates = (callback: (update: any) => void) => {
    if (socket) {
      socket.on('form-update', callback);
    }
  };

  const value = {
    templates,
    getTemplate,
    updateTemplate,
    subscribeToUpdates,
  };

  return <FormContext.Provider value={value}>{children}</FormContext.Provider>;
}; 