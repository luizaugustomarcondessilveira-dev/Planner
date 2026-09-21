import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  User,
  Camera,
  Upload,
  Sparkles,
  Check,
  AlertCircle,
  Heart,
  Baby,
  BookOpen,
  Trash2,
  Calendar,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { PersonProfile, EventCategory } from '../../types';
import { resizeImage } from '../../utils/imageResizer';

interface EditPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: PersonProfile | null;
  isNewPerson?: boolean;
  allPeople?: PersonProfile[];
  eventsCount?: number;
  onSavePerson: (updatedPerson: PersonProfile) => void;
  onDeletePerson?: (personId: string, reassignToPersonId?: string) => void;
}

const CATEGORY_OPTIONS: {
  id: EventCategory;
  label: string;
  defaultColor: string;
  icon: typeof BookOpen;
  desc: string;
}[] = [
  {
    id: 'pessoal',
    label: 'Pessoal',
    defaultColor: '#6B3F2A',
    icon: BookOpen,
    desc: 'Estudos, autocuidado, TCC e devocionais',
  },
  {
    id: 'familia',
    label: 'Família & Casal',
    defaultColor: '#B88E72',
    icon: Heart,
    desc: 'Compras da casa, encontros, casamento e viagens',
  },
  {
    id: 'pequenos',
    label: 'Filhos',
    defaultColor: '#E8A5B8',
    icon: Baby,
    desc: 'Pediatra, escola, vacinas e cuidados dos filhos',
  },
];

const COLOR_PRESETS = [
  { hex: '#6B3F2A', label: 'Marrom Canela' },
  { hex: '#502916', label: 'Café Intenso' },
  { hex: '#B88E72', label: 'Caramelo Suave' },
  { hex: '#E8A5B8', label: 'Rosa Blush' },
  { hex: '#844E5F', label: 'Rosa Vinho' },
  { hex: '#F2C4CE', label: 'Rosa Bebê' },
  { hex: '#9C6644', label: 'Terracota' },
  { hex: '#5E503F', label: 'Noz Nobre' },
];

export const EditPersonModal: React.FC<EditPersonModalProps> = ({
  isOpen,
  onClose,
  person,
  isNewPerson = false,
  allPeople = [],
  eventsCount = 0,
  onSavePerson,
  onDeletePerson,
}) => {
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [category, setCategory] = useState<EventCategory>('pessoal');
  const [color, setColor] = useState('#6B3F2A');
  const [birthDate, setBirthDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Deletion confirmation flow states
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [deleteActionChoice, setDeleteActionChoice] = useState<'reassign' | 'delete_events'>('reassign');
  const [reassignTargetId, setReassignTargetId] = useState<string>('me');

  const otherPeople = allPeople.filter((p) => p.id !== person?.id);

  useEffect(() => {
    if (isOpen) {
      setIsConfirmingDelete(false);
      setError(null);
      if (person) {
        setName(person.name || '');
        setAvatarUrl(person.avatarUrl || '');
        setCategory(person.category || 'pessoal');
        setColor(person.color || '#6B3F2A');
        
        // Handle birthDate and notes
        const existingBirthDate = person.birthDate || '';
        if (existingBirthDate && /^\d{4}-\d{2}-\d{2}$/.test(existingBirthDate)) {
          setBirthDate(existingBirthDate);
          setNotes(person.notes || '');
        } else if (existingBirthDate) {
          // Legacy free-text format (e.g. "3 aninhos")
          setBirthDate('');
          setNotes(
            person.notes
              ? `${person.notes} (Idade informada: ${existingBirthDate})`
              : `Idade informada: ${existingBirthDate}`
          );
        } else {
          setBirthDate('');
          setNotes(person.notes || '');
        }
      } else {
        // Creating fresh new person
        setName('');
        setAvatarUrl('');
        setCategory('pessoal');
        setColor('#6B3F2A');
        setBirthDate('');
        setNotes('');
      }

      if (otherPeople.length > 0) {
        setReassignTargetId(otherPeople[0].id);
      }
    }
  }, [person, isOpen]);

  if (!isOpen) return null;

  const isPrimaryPerson = person?.id === 'me' || person?.role === 'primary';

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const resized = await resizeImage(file, 400, 400);
      setAvatarUrl(resized);
      setError(null);
    } catch (err) {
      console.error('Erro ao processar imagem:', err);
      setError('Não foi possível carregar a imagem. Tente outra foto.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCategorySelect = (newCategory: EventCategory) => {
    setCategory(newCategory);
    const preset = CATEGORY_OPTIONS.find((c) => c.id === newCategory);
    if (preset && (!color || color === '#6B3F2A' || color === '#B88E72' || color === '#E8A5B8')) {
      setColor(preset.defaultColor);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('O nome da pessoa é obrigatório e não pode ficar vazio.');
      return;
    }

    const targetPersonId = person?.id || crypto.randomUUID();
    const targetRole =
      person?.role ||
      (category === 'pequenos'
        ? 'kid'
        : targetPersonId === 'lucas'
        ? 'spouse'
        : 'member');

    onSavePerson({
      id: targetPersonId,
      name: trimmedName,
      avatarUrl: avatarUrl.trim(),
      category,
      color,
      role: targetRole,
      birthDate: category === 'pequenos' && birthDate ? birthDate : undefined,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  const handleExecuteDelete = () => {
    if (!person || isPrimaryPerson) return;
    if (!onDeletePerson) return;

    if (eventsCount > 0 && deleteActionChoice === 'reassign') {
      onDeletePerson(person.id, reassignTargetId);
    } else {
      onDeletePerson(person.id, undefined);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#231A14]/65 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-[#FAF7F2] dark:bg-[#1E1712] rounded-3xl border border-[#EBDED5] dark:border-[#3D2E24] p-5 sm:p-6 space-y-4 shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#EBDED5]/60 dark:border-[#3D2E24] pb-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xs"
              style={{ backgroundColor: color }}
            >
              {category === 'pequenos' ? <Baby className="w-5 h-5" /> : <User className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-serif text-lg sm:text-xl font-semibold text-[#452414] dark:text-[#F6F1EC]">
                {isNewPerson || !person ? 'Adicionar Pessoa' : 'Editar Perfil'}
              </h3>
              <p className="text-xs text-[#8C6E5E] dark:text-[#B59D8F]">
                {isNewPerson || !person
                  ? 'Cadastre um novo membro da família ou pessoa'
                  : 'Altere nome, categoria, cor e detalhes'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-[#8C6E5E] hover:text-[#452414] dark:hover:text-[#F6F1EC] hover:bg-[#F0EDE9] dark:hover:bg-[#2A2019] transition-colors"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Validation Error Banner */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Delete Confirmation Step */}
        {isConfirmingDelete && person && !isPrimaryPerson ? (
          <div className="p-4 rounded-2xl bg-white dark:bg-[#251D17] border border-red-200 dark:border-red-900 space-y-3.5 animate-fade-in">
            <div className="flex items-start gap-2.5 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  Confirmar Exclusão de {person.name}
                </h4>
                <p className="text-xs text-[#8C6E5E] dark:text-[#B59D8F] mt-1">
                  Esta ação removerá a pessoa do sistema.
                </p>
              </div>
            </div>

            {eventsCount > 0 ? (
              <div className="space-y-2 pt-2 border-t border-[#EBDED5] dark:border-[#3D2E24]">
                <p className="text-xs font-semibold text-[#452414] dark:text-[#F6F1EC]">
                  Esta pessoa possui <span className="text-red-600 dark:text-red-400 font-bold">{eventsCount}</span> compromisso(s) na agenda. O que deseja fazer com eles?
                </p>

                <div className="space-y-2">
                  <label className="flex items-start gap-2 p-2.5 rounded-xl border border-[#EBDED5] dark:border-[#3D2E24] cursor-pointer hover:bg-[#FAF7F2] dark:hover:bg-[#2A2019]">
                    <input
                      type="radio"
                      name="delete_choice"
                      checked={deleteActionChoice === 'reassign'}
                      onChange={() => setDeleteActionChoice('reassign')}
                      className="mt-0.5 accent-[#6B3F2A]"
                    />
                    <div className="text-xs flex-1">
                      <span className="font-semibold text-[#452414] dark:text-[#F6F1EC] block">
                        Reatribuir compromissos para outra pessoa
                      </span>
                      {deleteActionChoice === 'reassign' && otherPeople.length > 0 && (
                        <select
                          value={reassignTargetId}
                          onChange={(e) => setReassignTargetId(e.target.value)}
                          className="mt-2 w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#1E1712] border border-[#EBDED5] dark:border-[#3D2E24] rounded-lg text-[#452414] dark:text-[#F6F1EC]"
                        >
                          {otherPeople.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.category === 'pessoal' ? 'Pessoal' : p.category === 'pequenos' ? 'Filhos' : 'Família & Casal'})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </label>

                  <label className="flex items-start gap-2 p-2.5 rounded-xl border border-red-200 dark:border-red-950/60 bg-red-50/40 dark:bg-red-950/20 cursor-pointer">
                    <input
                      type="radio"
                      name="delete_choice"
                      checked={deleteActionChoice === 'delete_events'}
                      onChange={() => setDeleteActionChoice('delete_events')}
                      className="mt-0.5 accent-red-600"
                    />
                    <div className="text-xs">
                      <span className="font-semibold text-red-700 dark:text-red-300 block">
                        Excluir todos os {eventsCount} compromissos vinculados
                      </span>
                      <span className="text-[11px] text-[#8C6E5E] dark:text-[#B59D8F]">
                        Os eventos desta pessoa serão apagados da agenda permanentemente.
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#8C6E5E] dark:text-[#B59D8F]">
                Nenhum compromisso está vinculado a esta pessoa.
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(false)}
                className="px-3.5 py-2 rounded-full text-xs font-medium text-[#8C6E5E] hover:text-[#452414] transition-colors"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                className="px-5 py-2 rounded-full text-xs font-semibold text-white bg-red-600 hover:bg-red-700 active:scale-[0.98] transition-all shadow-xs"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Avatar Preview & Upload */}
            <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24]">
              <div className="relative shrink-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={name || 'Avatar'}
                    className="w-14 h-14 rounded-full object-cover border-2 shadow-xs"
                    style={{ borderColor: color }}
                  />
                ) : (
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-xs"
                    style={{ backgroundColor: color }}
                  >
                    {name ? name.trim()[0]?.toUpperCase() : '?'}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#502916] text-white flex items-center justify-center shadow-xs hover:bg-[#6B3F2A] transition-colors"
                  title="Trocar foto"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex-1 min-w-0 space-y-1.5">
                <span className="text-xs font-semibold text-[#452414] dark:text-[#F6F1EC] block">
                  Foto / Avatar (Opcional)
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-3 py-1.5 rounded-full text-xs font-medium text-[#6B3F2A] dark:text-[#F6F1EC] bg-[#FAF7F2] dark:bg-[#2A2019] border border-[#EBDED5] dark:border-[#3D2E24] hover:bg-[#F0EDE9] transition-colors flex items-center gap-1.5"
                  >
                    <Upload className="w-3 h-3 text-[#E8A5B8]" />
                    <span>{isUploading ? 'Carregando...' : 'Carregar Foto'}</span>
                  </button>
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl('')}
                      className="px-2.5 py-1.5 rounded-full text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors flex items-center gap-1"
                      title="Remover foto"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remover</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Nome Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#452414] dark:text-[#F6F1EC]">
                Nome da Pessoa <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Ex: Theo, Lucas, Sofia..."
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] rounded-xl text-[#452414] dark:text-[#F6F1EC] placeholder-[#B59D8F] focus:outline-none focus:border-[#6B3F2A] transition-colors font-medium"
                required
                autoFocus
              />
            </div>

            {/* Marcador / Categoria */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#452414] dark:text-[#F6F1EC]">
                Categoria Principal
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {CATEGORY_OPTIONS.map((opt) => {
                  const IconComponent = opt.icon;
                  const isSelected = category === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleCategorySelect(opt.id)}
                      className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col items-start gap-1.5 ${
                        isSelected
                          ? 'bg-white dark:bg-[#251D17] border-[#6B3F2A] dark:border-[#E8A5B8] ring-2 ring-[#6B3F2A]/20 dark:ring-[#E8A5B8]/20 shadow-xs'
                          : 'bg-white/60 dark:bg-[#251D17]/60 border-[#EBDED5] dark:border-[#3D2E24] hover:bg-white dark:hover:bg-[#251D17]'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-white"
                          style={{ backgroundColor: opt.defaultColor }}
                        >
                          <IconComponent className="w-3.5 h-3.5" />
                        </div>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-[#502916] text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#452414] dark:text-[#F6F1EC] block">
                          {opt.label}
                        </span>
                        <span className="text-[10px] text-[#8C6E5E] dark:text-[#B59D8F] line-clamp-2 leading-tight">
                          {opt.desc}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fields specifically for "Filhos" */}
            {category === 'pequenos' && (
              <div className="p-3.5 rounded-2xl bg-[#FDF4F5] dark:bg-[#2E2026] border border-[#E8A5B8]/60 space-y-3 animate-fade-in">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#844E5F] dark:text-[#F2C4CE]">
                  <Baby className="w-4 h-4" />
                  <span>Dados Específicos do Filho</span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#452414] dark:text-[#F6F1EC] mb-1">
                    Data de Nascimento (calcula a idade automaticamente)
                  </label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-[#1E1712] border border-[#EBDED5] dark:border-[#3D2E24] rounded-xl text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:border-[#6B3F2A]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#452414] dark:text-[#F6F1EC] mb-1">
                    Observações & Cuidados (escola, natação, vacinas, rotinas)
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: Natação terças e quintas às 16h, pediatra semestral..."
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-[#1E1712] border border-[#EBDED5] dark:border-[#3D2E24] rounded-xl text-[#452414] dark:text-[#F6F1EC] placeholder-[#B59D8F] focus:outline-none focus:border-[#6B3F2A]"
                  />
                </div>
              </div>
            )}

            {/* Cor do Marcador */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#452414] dark:text-[#F6F1EC]">
                Cor do Marcador & Chips
              </label>
              <div className="flex items-center gap-2 flex-wrap p-2.5 bg-white dark:bg-[#251D17] rounded-2xl border border-[#EBDED5] dark:border-[#3D2E24]">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.hex}
                    type="button"
                    onClick={() => setColor(preset.hex)}
                    className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center ${
                      color === preset.hex
                        ? 'scale-110 ring-2 ring-offset-2 ring-[#502916] dark:ring-white dark:ring-offset-[#251D17]'
                        : 'hover:scale-105 opacity-90 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: preset.hex }}
                    title={preset.label}
                  >
                    {color === preset.hex && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#EBDED5] dark:border-[#3D2E24]">
              <div>
                {!isNewPerson && person && !isPrimaryPerson && onDeletePerson ? (
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(true)}
                    className="px-3.5 py-2 rounded-full text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir pessoa</span>
                  </button>
                ) : isPrimaryPerson ? (
                  <span className="text-[11px] text-[#8C6E5E] dark:text-[#B59D8F] italic">
                    Perfil principal
                  </span>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-full text-xs font-medium text-[#8C6E5E] hover:text-[#452414] dark:hover:text-[#F6F1EC] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full text-xs font-semibold text-white bg-[#502916] hover:bg-[#6B3F2A] active:scale-[0.98] shadow-xs transition-all flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isNewPerson || !person ? 'Adicionar' : 'Salvar'}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
