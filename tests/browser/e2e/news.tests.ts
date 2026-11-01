describe('Personal popup', () => {
    it('does not expose news or enable promotional polling from old settings', async () => {
        await backgroundUtils.changeSettings({fetchNews: true});
        await backgroundUtils.setNews([{id: 'some', date: '10', url: '/', headline: 'Test news'}]);
        const data = await backgroundUtils.collectData();
        expect(data.settings.fetchNews).toBe(false);
        expect(data.news).toEqual([]);
        await popupUtils.exists('.filter-settings');
    });
});
