import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent, ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { TopBar } from '../components/TopBar'
import { api, ApiError } from '../lib/api'
import type { Car, ModCategory } from '../types'

type FormState = {
  nickname: string
  brand: string
  model: string
  year: string
  drivetrain: Car['drivetrain']
  aspiration: Car['aspiration']
  engine: string
  displacement: string
  gearbox: string
  suspension: Car['suspension']
  suspensionDetail: string
  wheels: string
  tires: string
  brakes: string
  hp: string
  whp: string
  torqueKgfm: string
  boostBar: string
  fuel: string
  ecu: string
  stage: string
  buildStatus: Car['buildStatus']
  isPrimary: boolean
  coverUrl: string
}

const EMPTY: FormState = {
  nickname: '',
  brand: '',
  model: '',
  year: String(new Date().getFullYear()),
  drivetrain: 'dianteira',
  aspiration: 'aspirado',
  engine: '',
  displacement: '',
  gearbox: '',
  suspension: 'original',
  suspensionDetail: '',
  wheels: '',
  tires: '',
  brakes: '',
  hp: '',
  whp: '',
  torqueKgfm: '',
  boostBar: '',
  fuel: '',
  ecu: '',
  stage: '',
  buildStatus: 'original',
  isPrimary: false,
  coverUrl: '',
}

const MOD_CATEGORIES: ModCategory[] = [
  'motor',
  'suspensao',
  'freios',
  'rodas',
  'aerodinamica',
  'seguranca',
  'eletronica',
]

export function CarForm() {
  const { id } = useParams<{ id: string }>()
  const editing = Boolean(id)
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<FormState>(EMPTY)
  const [mods, setMods] = useState<{ id?: string; category: ModCategory; label: string }[]>([])
  const [newModLabel, setNewModLabel] = useState('')
  const [newModCategory, setNewModCategory] = useState<ModCategory>('motor')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(editing)

  useEffect(() => {
    if (!id) return
    api.get<Car>(`/cars/${id}`).then((car) => {
      setForm({
        nickname: car.nickname,
        brand: car.brand,
        model: car.model,
        year: String(car.year),
        drivetrain: car.drivetrain,
        aspiration: car.aspiration,
        engine: car.engine ?? '',
        displacement: car.displacement ?? '',
        gearbox: car.gearbox ?? '',
        suspension: car.suspension,
        suspensionDetail: car.suspensionDetail ?? '',
        wheels: car.wheels ?? '',
        tires: car.tires ?? '',
        brakes: car.brakes ?? '',
        hp: car.hp ? String(car.hp) : '',
        whp: car.whp ? String(car.whp) : '',
        torqueKgfm: car.torqueKgfm ? String(car.torqueKgfm) : '',
        boostBar: car.boostBar ? String(car.boostBar) : '',
        fuel: car.fuel ?? '',
        ecu: car.ecu ?? '',
        stage: car.stage ?? '',
        buildStatus: car.buildStatus,
        isPrimary: car.isPrimary,
        coverUrl: car.coverUrl ?? '',
      })
      setMods(car.mods)
      setLoading(false)
    })
  }, [id])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function onPickCover(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const result = await api.upload<{ url: string }>('/upload', file)
      set('coverUrl', result.url)
    } catch {
      setError('Não foi possível enviar a foto.')
    } finally {
      setUploading(false)
    }
  }

  function addMod() {
    if (!newModLabel.trim()) return
    setMods((prev) => [...prev, { category: newModCategory, label: newModLabel.trim() }])
    setNewModLabel('')
  }

  async function removeMod(index: number) {
    const mod = mods[index]
    setMods((prev) => prev.filter((_, i) => i !== index))
    if (editing && id && mod.id) {
      await api.delete(`/cars/${id}/mods/${mod.id}`).catch(() => {})
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const payload = {
        nickname: form.nickname.trim(),
        brand: form.brand.trim(),
        model: form.model.trim(),
        year: Number(form.year),
        drivetrain: form.drivetrain,
        aspiration: form.aspiration,
        engine: form.engine.trim() || undefined,
        displacement: form.displacement.trim() || undefined,
        gearbox: form.gearbox.trim() || undefined,
        suspension: form.suspension,
        suspensionDetail: form.suspensionDetail.trim() || undefined,
        wheels: form.wheels.trim() || undefined,
        tires: form.tires.trim() || undefined,
        brakes: form.brakes.trim() || undefined,
        hp: form.hp ? Number(form.hp) : undefined,
        whp: form.whp ? Number(form.whp) : undefined,
        torqueKgfm: form.torqueKgfm ? Number(form.torqueKgfm) : undefined,
        boostBar: form.boostBar ? Number(form.boostBar) : undefined,
        fuel: form.fuel.trim() || undefined,
        ecu: form.ecu.trim() || undefined,
        stage: form.stage.trim() || undefined,
        buildStatus: form.buildStatus,
        isPrimary: form.isPrimary,
        coverUrl: form.coverUrl || undefined,
        mods: editing ? undefined : mods,
      }

      const car = editing
        ? await api.patch<Car>(`/cars/${id}`, payload)
        : await api.post<Car>('/cars', payload)

      if (editing) {
        const existingIds = new Set(car.mods.map((m) => m.id))
        for (const mod of mods) {
          if (!mod.id || !existingIds.has(mod.id)) {
            await api.post(`/cars/${id}/mods`, { category: mod.category, label: mod.label })
          }
        }
      }

      navigate(`/carro/${car.id}`, { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível salvar o carro.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-md">
        <TopBar title="Carregando…" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md pb-10">
      <TopBar title={editing ? 'Editar carro' : 'Novo carro'} />
      <form onSubmit={onSubmit} className="flex flex-col gap-5 px-4 py-4">
        <label className="flex aspect-video w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--glass)]">
          {form.coverUrl ? (
            <img src={form.coverUrl} alt="Capa" className="h-full w-full object-cover" />
          ) : (
            <span className="text-center text-sm text-[var(--text-muted)]">
              {uploading ? 'Enviando…' : '📷 Toque para escolher a foto de capa'}
            </span>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onPickCover} />
        </label>

        <Section title="Identificação">
          <Field label="Apelido do projeto">
            <input required value={form.nickname} onChange={(e) => set('nickname', e.target.value)} className={inputClass} />
          </Field>
          <div className="flex gap-3">
            <Field label="Marca" className="flex-1">
              <input required value={form.brand} onChange={(e) => set('brand', e.target.value)} className={inputClass} />
            </Field>
            <Field label="Modelo" className="flex-1">
              <input required value={form.model} onChange={(e) => set('model', e.target.value)} className={inputClass} />
            </Field>
            <Field label="Ano" className="w-24">
              <input
                required
                type="number"
                min={1950}
                max={2100}
                value={form.year}
                onChange={(e) => set('year', e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>
        </Section>

        <Section title="Motor e tração">
          <div className="flex gap-3">
            <Field label="Tração" className="flex-1">
              <select value={form.drivetrain} onChange={(e) => set('drivetrain', e.target.value as Car['drivetrain'])} className={inputClass}>
                <option value="dianteira">Dianteira</option>
                <option value="traseira">Traseira</option>
                <option value="4x4">4x4</option>
              </select>
            </Field>
            <Field label="Aspiração" className="flex-1">
              <select value={form.aspiration} onChange={(e) => set('aspiration', e.target.value as Car['aspiration'])} className={inputClass}>
                <option value="aspirado">Aspirado</option>
                <option value="turbo">Turbo</option>
                <option value="supercharger">Supercharger</option>
                <option value="turbo+supercharger">Turbo + Supercharger</option>
                <option value="eletrico">Elétrico</option>
              </select>
            </Field>
          </div>
          <div className="flex gap-3">
            <Field label="Motor" className="flex-1">
              <input value={form.engine} onChange={(e) => set('engine', e.target.value)} placeholder='ex.: 2.0 TSI Gen3' className={inputClass} />
            </Field>
            <Field label="Câmbio" className="flex-1">
              <input value={form.gearbox} onChange={(e) => set('gearbox', e.target.value)} placeholder="ex.: 7-speed DSG" className={inputClass} />
            </Field>
          </div>
          <div className="flex gap-3">
            <Field label="HP" className="flex-1">
              <input type="number" min={0} value={form.hp} onChange={(e) => set('hp', e.target.value)} className={inputClass} />
            </Field>
            <Field label="WHP" className="flex-1">
              <input type="number" min={0} value={form.whp} onChange={(e) => set('whp', e.target.value)} className={inputClass} />
            </Field>
            <Field label="Torque (kgfm)" className="flex-1">
              <input type="number" step="0.1" value={form.torqueKgfm} onChange={(e) => set('torqueKgfm', e.target.value)} className={inputClass} />
            </Field>
          </div>
          <div className="flex gap-3">
            <Field label="Pressão (bar)" className="flex-1">
              <input type="number" step="0.1" value={form.boostBar} onChange={(e) => set('boostBar', e.target.value)} className={inputClass} />
            </Field>
            <Field label="Combustível" className="flex-1">
              <input value={form.fuel} onChange={(e) => set('fuel', e.target.value)} placeholder="ex.: E100" className={inputClass} />
            </Field>
            <Field label="ECU" className="flex-1">
              <input value={form.ecu} onChange={(e) => set('ecu', e.target.value)} placeholder="ex.: FuelTech FT550" className={inputClass} />
            </Field>
          </div>
        </Section>

        <Section title="Chassi">
          <div className="flex gap-3">
            <Field label="Suspensão" className="flex-1">
              <select value={form.suspension} onChange={(e) => set('suspension', e.target.value as Car['suspension'])} className={inputClass}>
                <option value="original">Original</option>
                <option value="coilover">Coilover</option>
                <option value="a ar">A ar</option>
                <option value="rebaixamento fixo">Rebaixamento fixo</option>
                <option value="competicao">Competição</option>
              </select>
            </Field>
            <Field label="Detalhe da suspensão" className="flex-1">
              <input value={form.suspensionDetail} onChange={(e) => set('suspensionDetail', e.target.value)} placeholder="ex.: Öhlins TTX" className={inputClass} />
            </Field>
          </div>
          <div className="flex gap-3">
            <Field label="Rodas" className="flex-1">
              <input value={form.wheels} onChange={(e) => set('wheels', e.target.value)} className={inputClass} />
            </Field>
            <Field label="Pneus" className="flex-1">
              <input value={form.tires} onChange={(e) => set('tires', e.target.value)} className={inputClass} />
            </Field>
          </div>
          <Field label="Freios">
            <input value={form.brakes} onChange={(e) => set('brakes', e.target.value)} className={inputClass} />
          </Field>
        </Section>

        <Section title="Status">
          <div className="flex gap-3">
            <Field label="Estágio de preparação" className="flex-1">
              <input value={form.stage} onChange={(e) => set('stage', e.target.value)} placeholder="ex.: Stage 3" className={inputClass} />
            </Field>
            <Field label="Situação do projeto" className="flex-1">
              <select value={form.buildStatus} onChange={(e) => set('buildStatus', e.target.value as Car['buildStatus'])} className={inputClass}>
                <option value="original">Original</option>
                <option value="em construcao">Em construção</option>
                <option value="pronto para pista">Pronto para pista</option>
                <option value="show car">Show car</option>
              </select>
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isPrimary} onChange={(e) => set('isPrimary', e.target.checked)} />
            Definir como carro principal da garagem
          </label>
        </Section>

        <Section title="Preparação (chips)">
          <div className="flex flex-wrap gap-1.5">
            {mods.map((mod, i) => (
              <span key={mod.id ?? i} className="flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--glass)] px-3 py-1 text-xs font-semibold">
                {mod.label}
                <button type="button" onClick={() => removeMod(i)} className="text-[var(--text-muted)]">
                  ✕
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <select value={newModCategory} onChange={(e) => setNewModCategory(e.target.value as ModCategory)} className={`${inputClass} w-32`}>
              {MOD_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              value={newModLabel}
              onChange={(e) => setNewModLabel(e.target.value)}
              placeholder="ex.: TURBO IS38"
              className={`${inputClass} flex-1`}
            />
            <button type="button" onClick={addMod} className="rounded-lg border border-[var(--border)] px-3 text-sm font-semibold">
              +
            </button>
          </div>
        </Section>

        {error && <p className="text-sm text-[var(--brand)]">{error}</p>}

        <button type="submit" disabled={busy} className="rounded-full bg-white py-3 text-sm font-bold text-black disabled:opacity-50">
          {busy ? 'Salvando…' : editing ? 'Salvar alterações' : 'Adicionar carro'}
        </button>
      </form>
    </div>
  )
}

const inputClass =
  'w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm outline-none focus:border-[var(--border-active)]'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--text-muted)]">{title}</h2>
      {children}
    </div>
  )
}

function Field({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <label className={`flex flex-col gap-1 ${className ?? ''}`}>
      <span className="text-[11px] font-semibold uppercase text-[var(--text-dim)]">{label}</span>
      {children}
    </label>
  )
}
