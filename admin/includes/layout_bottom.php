        </main>

        <footer class="px-6 py-4 border-t border-slate-200 bg-white text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>CDC Management System &middot; Admin Portal &middot; Unified PDO + Argon2id + CSV/Excel Sync</div>
            <div>3 Portals: Admin &bull; Student &bull; Faculty/Coordinator</div>
        </footer>
    </div>
</div>

<script>
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    function toggleSidebar() {
        const sb = document.getElementById('sidebar');
        sb.classList.toggle('-translate-x-full');
    }

    function openModal(id) {
        const el = document.getElementById(id);
        if (el) el.classList.add('open');
    }

    function closeModal(id) {
        const el = document.getElementById(id);
        if (el) el.classList.remove('open');
    }

    // Close modals on backdrop click or Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.cdc-modal.open').forEach(m => m.classList.remove('open'));
        }
    });
    document.querySelectorAll('.cdc-modal').forEach(m => {
        m.addEventListener('click', (e) => {
            if (e.target === m) m.classList.remove('open');
        });
    });
</script>
</body>
</html>
