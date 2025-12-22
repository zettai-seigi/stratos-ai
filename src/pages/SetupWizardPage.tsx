import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SetupWizard } from '../components/wizard';

export const SetupWizardPage: React.FC = () => {
  const navigate = useNavigate();

  const handleComplete = () => {
    navigate('/');
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return <SetupWizard onComplete={handleComplete} onCancel={handleCancel} />;
};
