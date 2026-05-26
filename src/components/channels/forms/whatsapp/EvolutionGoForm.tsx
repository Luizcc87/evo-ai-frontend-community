import { useLanguage } from '@/hooks/useLanguage';
import { FormField } from '../../shared/FormField';
import { FormCheckbox } from '../../shared/FormCheckbox';
import { FormSection } from '../../shared/FormSection';
import { FormData } from '@/hooks/channels/useChannelForm';
import { sanitizeInboxName } from '@/utils/sanitizeName';
import { PhoneInput } from '@/components/shared/PhoneInput';
import { ProxyPanel } from './ProxyPanel';

interface EvolutionGoFormProps {
  form: FormData;
  onFormChange: (key: string, value: string | boolean) => void;
  hasEvolutionGoConfig: boolean;
}

export const EvolutionGoForm = ({ form, onFormChange, hasEvolutionGoConfig }: EvolutionGoFormProps) => {
  const { t } = useLanguage('whatsapp');
  const getStr = (key: string, fallback = ''): string =>
    typeof form[key] === 'string' ? (form[key] as string) : fallback;

  const handleDisplayNameChange = (value: string) => {
    onFormChange('display_name', value);
    onFormChange('name', sanitizeInboxName(value));
  };

  return (
    <div className="space-y-6">
      {/* Basic Configuration - Only show API/Token if not auto-filled */}
      {!hasEvolutionGoConfig && (
        <>
          <FormField
            label={t('evolutionGoForm.fields.apiUrl.label')}
            value={getStr('api_url')}
            onChange={value => onFormChange('api_url', value)}
            placeholder={t('evolutionGoForm.fields.apiUrl.placeholder')}
            type="url"
            required
          />

          <FormField
            label={t('evolutionGoForm.fields.adminToken.label')}
            value={getStr('admin_token')}
            onChange={value => onFormChange('admin_token', value)}
            placeholder={t('evolutionGoForm.fields.adminToken.placeholder')}
            type="password"
            required
          />
        </>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-tour="whatsapp-credentials">
        <FormField
          label={t('evolutionGoForm.fields.displayName.label')}
          value={getStr('display_name')}
          onChange={handleDisplayNameChange}
          placeholder={t('evolutionGoForm.fields.displayName.placeholder')}
          helpText={t('evolutionGoForm.fields.displayName.helpText')}
          required
        />
        <FormField
          label={t('evolutionGoForm.fields.channelName.label')}
          value={getStr('name')}
          onChange={value => onFormChange('name', value)}
          placeholder={t('evolutionGoForm.fields.channelName.placeholder')}
          helpText={t('evolutionGoForm.fields.channelName.helpText')}
          required
          readOnly
        />
      </div>

      <div>
        <label className="text-sm font-medium text-sidebar-foreground/80 block mb-1">
          {t('evolutionGoForm.fields.phoneNumber.label')} <span className="text-destructive">*</span>
        </label>
        <PhoneInput
          value={getStr('phone_number')}
          onChange={value => onFormChange('phone_number', value)}
          placeholder={t('evolutionGoForm.fields.phoneNumber.placeholder')}
          defaultCountry="BR"
        />
      </div>

      {/* Optional fields populated after verification */}
      {getStr('instance_uuid') && (
        <FormField
          label={t('evolutionGoForm.fields.instanceUuid.label')}
          value={getStr('instance_uuid')}
          onChange={value => onFormChange('instance_uuid', value)}
          placeholder={t('evolutionGoForm.fields.instanceUuid.placeholder')}
          readOnly
        />
      )}

      {getStr('instance_token') && (
        <FormField
          label={t('evolutionGoForm.fields.instanceToken.label')}
          value={getStr('instance_token')}
          onChange={value => onFormChange('instance_token', value)}
          placeholder={t('evolutionGoForm.fields.instanceToken.placeholder')}
          type="password"
          readOnly
        />
      )}

      <FormSection
        title={t('evolutionForm.sections.proxy.title')}
        className="bg-gray-50/10 border-gray-200/20"
      >
        <div className="mb-4">
          <FormCheckbox
            label={t('evolutionForm.sections.proxy.enableProxy')}
            checked={!!form.proxy_enabled}
            onChange={checked => onFormChange('proxy_enabled', checked)}
          />
        </div>

        {form.proxy_enabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label={t('evolutionForm.sections.proxy.host.label')}
              value={getStr('proxy_host')}
              onChange={value => onFormChange('proxy_host', value)}
              placeholder={t('evolutionForm.sections.proxy.host.placeholder')}
            />
            <FormField
              label={t('evolutionForm.sections.proxy.port.label')}
              value={getStr('proxy_port')}
              onChange={value => onFormChange('proxy_port', value)}
              placeholder={t('evolutionForm.sections.proxy.port.placeholder')}
            />
            <div>
              <label className="text-sm font-medium text-sidebar-foreground/80">
                {t('evolutionForm.sections.proxy.protocol')}
              </label>
              <select
                value={getStr('proxy_protocol', 'http')}
                onChange={e => onFormChange('proxy_protocol', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              >
                <option value="http">HTTP</option>
                <option value="https">HTTPS</option>
                <option value="socks4">SOCKS4</option>
                <option value="socks5">SOCKS5</option>
              </select>
            </div>
            <FormField
              label={t('evolutionForm.sections.proxy.username.label')}
              value={getStr('proxy_username')}
              onChange={value => onFormChange('proxy_username', value)}
              placeholder={t('evolutionForm.sections.proxy.username.placeholder')}
            />
            <div className="md:col-span-2">
              <FormField
                label={t('evolutionForm.sections.proxy.password.label')}
                value={getStr('proxy_password')}
                onChange={value => onFormChange('proxy_password', value)}
                placeholder={t('evolutionForm.sections.proxy.password.placeholder')}
                type="password"
              />
            </div>
          </div>
        )}
      </FormSection>

      {/* Proxy management — only shown after instance is created */}
      {getStr('instance_uuid') && (
        <ProxyPanel instanceUuid={getStr('instance_uuid')} />
      )}

      {/* Advanced Settings - Evolution Go */}
      <FormSection
        title={t('evolutionGoForm.sections.instance.title')}
        className="bg-gray-50/10 border-gray-200/20"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Always Online */}
          <FormCheckbox
            label={t('evolutionGoForm.sections.instance.alwaysOnline')}
            checked={!!form.alwaysOnline}
            onChange={checked => onFormChange('alwaysOnline', checked)}
          />

          {/* Reject Call */}
          <FormCheckbox
            label={t('evolutionGoForm.sections.instance.rejectCall')}
            checked={!!form.rejectCall}
            onChange={checked => onFormChange('rejectCall', checked)}
          />

          {/* Read Messages */}
          <FormCheckbox
            label={t('evolutionGoForm.sections.instance.readMessages')}
            checked={!!form.readMessages}
            onChange={checked => onFormChange('readMessages', checked)}
          />

          {/* Ignore Groups */}
          <FormCheckbox
            label={t('evolutionGoForm.sections.instance.ignoreGroups')}
            checked={!!form.ignoreGroups}
            onChange={checked => onFormChange('ignoreGroups', checked)}
          />

          {/* Ignore Status */}
          <div className="md:col-span-2">
            <FormCheckbox
              label={t('evolutionGoForm.sections.instance.ignoreStatus')}
              checked={!!form.ignoreStatus}
              onChange={checked => onFormChange('ignoreStatus', checked)}
            />
          </div>
        </div>
      </FormSection>

      {/* Help Section */}
      <FormSection
        title={t('evolutionGoForm.help.title')}
        className="bg-green-50/10 border-green-200/20"
        data-tour="whatsapp-help"
      >
        <div className="text-sm text-sidebar-foreground/70 space-y-2">
          <p><strong>{t('evolutionGoForm.help.performance.title')}:</strong> {t('evolutionGoForm.help.performance.description')}</p>
          <p><strong>{t('evolutionGoForm.help.stability.title')}:</strong> {t('evolutionGoForm.help.stability.description')}</p>
          <p><strong>{t('evolutionGoForm.help.features.title')}:</strong> {t('evolutionGoForm.help.features.description')}</p>
          <p><strong>{t('evolutionGoForm.help.uuidToken.title')}:</strong> {t('evolutionGoForm.help.uuidToken.description')}</p>
        </div>
      </FormSection>
    </div>
  );
};
