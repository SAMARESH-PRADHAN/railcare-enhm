import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Pencil, Power, Plus, UserCog, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useDemo } from "@/lib/store";
import { chisOfClerk } from "@/lib/derive";
import type { Role, User } from "@/data/types";
import { EmptyState, PageHeader, SectionCard, DemoNote } from "@/components/shared/ui-bits";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "User Management | Admin | EnHM Management System" }] }),
  component: UserManagement,
});

type EditState = { mode: "add"; role: Role } | { mode: "edit"; user: User } | null;

function UserManagement() {
  const { db, actions } = useDemo();
  const [tab, setTab] = useState<"all" | "chi" | "clerk" | "officer">("all");
  const [search, setSearch] = useState("");
  const [edit, setEdit] = useState<EditState>(null);
  const [confirmUser, setConfirmUser] = useState<User | null>(null);
  const [form, setForm] = useState({ name: "", designation: "", phone: "", email: "" });

  const list = useMemo(() => {
    let users = db.users.filter((u) => u.role !== "admin");
    if (tab !== "all") users = users.filter((u) => u.role === tab);
    if (search.trim()) {
      const q = search.toLowerCase();
      users = users.filter((u) => `${u.name} ${u.designation} ${u.email} ${u.phone}`.toLowerCase().includes(q));
    }
    return users;
  }, [db.users, tab, search]);

  const openAdd = (role: Role) => {
    setForm({ name: "", designation: "", phone: "", email: "" });
    setEdit({ mode: "add", role });
  };
  const openEdit = (u: User) => {
    setForm({ name: u.name, designation: u.designation, phone: u.phone, email: u.email });
    setEdit({ mode: "edit", user: u });
  };

  const save = () => {
    if (!edit) return;
    const role = edit.mode === "add" ? edit.role : edit.user.role;
    const res = actions.upsertUser({
      ...(edit.mode === "edit" ? { id: edit.user.id } : {}),
      role, ...form,
    });
    if (!res.ok) { toast.error(res.error); return; }
    toast.success(edit.mode === "add" ? "User added" : "User details updated", { description: `${form.name} — ${role.toUpperCase()}` });
    setEdit(null);
  };

  const toggleActive = (u: User) => {
    const res = actions.toggleUserActive(u.id);
    if (!res.ok) { toast.error(res.error); return; }
    toast.success(u.active ? `${u.name} deactivated` : `${u.name} reactivated`, {
      description: u.active ? "Their stations and CHI supervision are released for reassignment." : undefined,
    });
    setConfirmUser(null);
  };

  const roleLabel: Record<string, string> = { chi: "CHI", clerk: "Clerk", officer: "Officer" };

  return (
    <div className="mx-auto max-w-[1300px]">
      <PageHeader
        kicker="Admin · Personnel"
        title="User Management"
        description="Add and edit CHIs, verification clerks and divisional officers. Deactivating a CHI releases their stations and clerk supervision for reassignment."
        actions={
          <>
            <Button size="sm" onClick={() => openAdd("chi")}><Plus className="mr-1.5 h-3.5 w-3.5" aria-hidden /> Add CHI</Button>
            <Button size="sm" variant="outline" onClick={() => openAdd("clerk")}><Plus className="mr-1.5 h-3.5 w-3.5" aria-hidden /> Add Clerk</Button>
            <Button size="sm" variant="outline" onClick={() => openAdd("officer")}><Plus className="mr-1.5 h-3.5 w-3.5" aria-hidden /> Add Officer</Button>
          </>
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList className="mb-3">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="chi">CHIs</TabsTrigger>
          <TabsTrigger value="clerk">Clerks</TabsTrigger>
          <TabsTrigger value="officer">Officers</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-0">
          <SectionCard title={`${list.length} user${list.length === 1 ? "" : "s"}`} icon={Users}
            actions={<Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, designation, phone…" className="h-8 w-56 text-xs" aria-label="Search users" />}>
            {list.length === 0 ? (
              <EmptyState icon={Users} title="No users match" />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Designation</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Scope</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {list.map((u) => {
                      const scope = u.role === "chi"
                        ? `${db.stations.filter((s) => s.chiId === u.id).length} station(s)`
                        : u.role === "clerk"
                          ? `${(u.supervisesChiIds ?? []).length} CHI · ${chisOfClerk(db, u.id).reduce((n, c) => n + db.stations.filter((s) => s.chiId === c.id).length, 0)} station(s)`
                          : "Division-wide";
                      return (
                        <TableRow key={u.id} className={cn(!u.active && "opacity-60")}>
                          <TableCell>
                            <Link to="/users/$userId" params={{ userId: u.id }} className="font-medium hover:text-primary hover:underline">{u.name}</Link>
                            {u.leaveNote && <span className="block text-[10px] text-warning-foreground">On leave — workload reassigned</span>}
                          </TableCell>
                          <TableCell><span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-bold uppercase">{roleLabel[u.role]}</span></TableCell>
                          <TableCell className="text-xs">{u.designation}</TableCell>
                          <TableCell className="whitespace-nowrap text-xs tabular-nums">
                            {u.phone}
                            <span className="block text-[10px] text-muted-foreground">{u.email}</span>
                          </TableCell>
                          <TableCell className="text-xs">{scope}</TableCell>
                          <TableCell>
                            <span className={cn("rounded-full px-2 py-0.5 text-[10.5px] font-semibold", u.active ? "status-good" : "status-neutral")}>
                              {u.active ? "Active" : "Deactivated"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => openEdit(u)} aria-label={`Edit ${u.name}`}>
                                <Pencil className="h-3.5 w-3.5" aria-hidden /> Edit
                              </Button>
                              {u.role !== "admin" && (
                                <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive hover:text-destructive" onClick={() => setConfirmUser(u)} aria-label={u.active ? `Deactivate ${u.name}` : `Reactivate ${u.name}`}>
                                  <Power className="h-3.5 w-3.5" aria-hidden /> {u.active ? "Deactivate" : "Activate"}
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
            <DemoNote>
              All names and contact details are fictional sample data for the client demonstration. The administrator account cannot be deactivated.
            </DemoNote>
          </SectionCard>
        </TabsContent>
      </Tabs>

      {/* Add/Edit modal */}
      <Dialog open={!!edit} onOpenChange={(v) => !v && setEdit(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{edit?.mode === "add" ? `Add ${roleLabel[edit.role]}` : "Edit user details"}</DialogTitle>
            <DialogDescription>
              {edit?.mode === "add"
                ? "The new account is active immediately and appears in the role switcher for demonstration."
                : "Contact details and designation can be corrected here. Roles are fixed per account in this prototype."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1.5"><Label htmlFor="u-name">Full name <span className="text-destructive">*</span></Label><Input id="u-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Rakesh Banerjee" /></div>
            <div className="space-y-1.5"><Label htmlFor="u-desig">Designation</Label><Input id="u-desig" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} placeholder={edit?.mode === "add" ? (edit.role === "chi" ? "Chief Health Inspector (CHI)" : edit.role === "clerk" ? "EnHM Verification Clerk" : "Divisional Officer, EnHM") : ""} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label htmlFor="u-phone">Mobile</Label><Input id="u-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 …" /></div>
              <div className="space-y-1.5"><Label htmlFor="u-email">Email</Label><Input id="u-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            </div>
            <p className="text-[11px] text-muted-foreground"><UserCog className="mr-1 inline h-3 w-3" aria-hidden /> Fictional demo data — do not enter real personal information.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEdit(null)}>Cancel</Button>
            <Button onClick={save} disabled={!form.name.trim()}>{edit?.mode === "add" ? "Add user" : "Save changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate confirm */}
      <Dialog open={!!confirmUser} onOpenChange={(v) => !v && setConfirmUser(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{confirmUser?.active ? "Deactivate" : "Reactivate"} {confirmUser?.name}?</DialogTitle>
            <DialogDescription>
              {confirmUser?.active
                ? confirmUser?.role === "chi"
                  ? "Their assigned stations become unassigned and clerk supervision links are removed. Reassign stations before deactivating where possible."
                  : "The account will no longer appear in active workflows."
                : "The account becomes active again."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmUser(null)}>Cancel</Button>
            <Button variant={confirmUser?.active ? "destructive" : "default"} onClick={() => confirmUser && toggleActive(confirmUser)}>
              {confirmUser?.active ? "Deactivate" : "Reactivate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
